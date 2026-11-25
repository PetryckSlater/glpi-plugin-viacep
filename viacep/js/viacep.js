/**
 * -----------------------------------------------------------------------------
 * Plugin ViaCEP Formulários para GLPI 10 e 11
 * Autor: Petryck Slater / Revo Infra
 * Finalidade: Consulta e preenchimento automático inteligente de endereços
 *             via API pública ViaCEP em formulários nativos do GLPI 11 e legados.
 * -----------------------------------------------------------------------------
 */

(function () {
    'use strict';

    console.log('[ViaCEP] Plugin v1.1.0 inicializado e ativo.');

    // Mapeamento oficial de UFs do Brasil (Sigla <-> Nome)
    const UF_MAP = {
        'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas',
        'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
        'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul',
        'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
        'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
        'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
        'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins'
    };

    /**
     * Sistema de Notificações Toast Não-bloqueante
     */
    function showToast(type, message, duration = 3500) {
        let container = document.getElementById('viacep-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'viacep-toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `viacep-toast ${type}`;

        let iconSvg = '';
        if (type === 'success') {
            iconSvg = `<svg class="viacep-toast-icon" viewBox="0 0 24 24" fill="none" stroke="#2fb344" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`;
        } else if (type === 'error' || type === 'warning') {
            iconSvg = `<svg class="viacep-toast-icon" viewBox="0 0 24 24" fill="none" stroke="${type === 'error' ? '#d63939' : '#f59f00'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
        } else {
            iconSvg = `<svg class="viacep-toast-icon" viewBox="0 0 24 24" fill="none" stroke="#206bc4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
        }

        toast.innerHTML = `${iconSvg}<span>${message}</span>`;
        container.appendChild(toast);

        // Animação suave de entrada
        requestAnimationFrame(() => toast.classList.add('show'));

        // Remoção automática após a duração
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    /**
     * Identifica o rótulo/pergunta associado ao campo (GLPI 11 Form Renderer, Formcreator e HTML puro)
     */
    function getAssociatedLabelText(input) {
        if (!input) return '';

        // 1. GLPI 11 Nativo (Form Renderer - <section aria-label="Nome da Pergunta" data-glpi-form-renderer-question>)
        const glpiQuestionSection = input.closest('section[data-glpi-form-renderer-question], [data-glpi-form-renderer-uuid]');
        if (glpiQuestionSection && glpiQuestionSection.getAttribute('aria-label')) {
            const sectionLabel = glpiQuestionSection.getAttribute('aria-label').trim();
            if (sectionLabel) return sectionLabel;
        }

        // 2. aria-label direto no input ou select
        if (input.getAttribute('aria-label')) {
            const aria = input.getAttribute('aria-label').trim();
            if (aria) return aria;
        }

        // 3. Label HTML padrão associado via atributo "for"
        if (input.id) {
            const labelFor = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
            if (labelFor && labelFor.textContent.trim()) {
                return labelFor.textContent.trim();
            }
        }

        // 4. Label que engloba diretamente o input
        const parentLabel = input.closest('label');
        if (parentLabel && parentLabel.textContent.trim()) {
            return parentLabel.textContent.trim();
        }

        // 5. Contêineres padrão de formulários (Bootstrap, Tabler, Formcreator legado)
        const container = input.closest('.formcreator_question, .field-container, .form-field, .mb-3, .form-group, .col, td');
        if (container) {
            const label = container.querySelector('label, .form-label, .control-label, th, .card-title, .form-check-label');
            if (label && label !== input && label.textContent.trim()) {
                return label.textContent.trim();
            }
        }

        // 6. Atributos auxiliares do próprio elemento
        return input.getAttribute('placeholder') || 
               input.getAttribute('title') || 
               input.name || 
               input.id || '';
    }

    /**
     * Verifica se o elemento informado é um campo de entrada de CEP
     */
    function isCepInput(input) {
        if (!input || input.tagName !== 'INPUT') return false;
        
        const type = (input.type || 'text').toLowerCase();
        if (!['text', 'search', 'tel', ''].includes(type)) return false;

        // Suporte a data-viacep="cep" manual caso o usuário queira marcar
        if (input.dataset.viacep === 'cep') return true;

        const labelText = getAssociatedLabelText(input).toLowerCase();
        const nameAttr = (input.name || '').toLowerCase();
        const idAttr = (input.id || '').toLowerCase();
        const placeholder = (input.placeholder || '').toLowerCase();

        // Regex estrito com limite de palavras para evitar falsos positivos
        const cepRegex = /\b(cep|c\.e\.p|c[oó]digo\s*postal)\b/i;

        return cepRegex.test(labelText) || 
               cepRegex.test(nameAttr) || 
               cepRegex.test(idAttr) || 
               cepRegex.test(placeholder);
    }

    /**
     * Busca campos relacionados (Rua, Bairro, Cidade, UF, Número) no escopo fornecido
     */
    function findFieldInScope(scope, matchRegex, excludeRegex) {
        if (!scope) return null;

        const elements = Array.from(scope.querySelectorAll('input:not([type="hidden"]), select, textarea'));
        
        for (const el of elements) {
            if (['submit', 'button', 'reset', 'file', 'image'].includes(el.type)) continue;

            const labelText = getAssociatedLabelText(el);
            const nameAttr = el.name || '';
            const idAttr = el.id || '';
            const placeholder = el.placeholder || '';
            const combined = `${labelText} ${nameAttr} ${idAttr} ${placeholder}`.toLowerCase();

            // Se bater em exclusão, pular
            if (excludeRegex && excludeRegex.test(combined)) continue;

            // Se bater na regex desejada, retorna o elemento
            if (matchRegex.test(combined)) {
                return el;
            }
        }
        return null;
    }

    /**
     * Define o valor de um campo de texto e propaga eventos de reatividade
     */
    function setInputValue(el, value) {
        if (!el || value === undefined || value === null) return;
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        if (window.jQuery) {
            window.jQuery(el).trigger('input').trigger('change');
        }
    }

    /**
     * Define o valor de um campo <select> de UF
     */
    function setSelectUf(select, uf) {
        if (!select || !uf) return;
        uf = uf.toUpperCase().trim();
        const nomeEstado = UF_MAP[uf] ? UF_MAP[uf].toLowerCase() : '';
        let matched = false;

        for (let i = 0; i < select.options.length; i++) {
            const opt = select.options[i];
            const optVal = (opt.value || '').toUpperCase().trim();
            const optText = (opt.text || '').trim();
            const optTextLower = optText.toLowerCase();

            if (optVal === uf || 
                optText.toUpperCase() === uf || 
                optText.toUpperCase().startsWith(uf + ' ') || 
                optText.toUpperCase().startsWith(uf + '-') || 
                optText.toUpperCase().endsWith(' ' + uf) || 
                optText.toUpperCase().endsWith('-' + uf) || 
                (nomeEstado && optTextLower.includes(nomeEstado))) {
                select.selectedIndex = i;
                matched = true;
                break;
            }
        }

        select.dispatchEvent(new Event('change', { bubbles: true }));
        if (window.jQuery) {
            window.jQuery(select).trigger('change');
            if (window.jQuery(select).data('select2')) {
                window.jQuery(select).trigger('change.select2');
            }
        }
    }

    /**
     * Preenche os campos do endereço localizados no formulário
     */
    function preencherEndereco(inputCep, dados) {
        // Escopo primário: seção do formulário, card ou container mais próximo
        const primaryScope = inputCep.closest('[data-glpi-form-renderer-section], .formcreator_section, .formcreator_form, .card, fieldset, form') || 
                             inputCep.closest('form') || 
                             document;

        // Padrões Regex com exclusões cuidadosas
        const regexRua = /\b(logradouro|rua|avenida|endere[çc]o|av\.?)\b/i;
        const excludeRua = /\b(n[uú]mero|bairro|complemento|cep|cidade|uf|estado|email|ip|mac|servidor|ticket|chamado)\b/i;

        const regexBairro = /\b(bairro|distrito)\b/i;
        const excludeBairro = /\b(logradouro|rua|cep|cidade|uf|estado)\b/i;

        const regexCidade = /\b(cidade|munic[ií]pio|localidade)\b/i;
        const excludeCidade = /\b(estado|uf|bairro|rua|cep|logradouro)\b/i;

        const regexUf = /\b(uf|estado)\b/i;
        const excludeUf = /\b(status|chamado|ticket|civil|conserva[çc][ãa]o)\b/i;

        const regexNumero = /\b(n[uú]mero|n[º°]|n\.)\b/i;
        const excludeNumero = /\b(s[eé]rie|patrim[oô]nio|chamado|ticket|cpf|cnpj|telefone|celular|nota|rg|matricula|matr[ií]cula)\b/i;

        const regexComplemento = /\b(complemento|apto|apartamento|bloco|andar|sala)\b/i;
        const excludeComplemento = /\b(documento|chamado|ticket)\b/i;

        // Localização com fallback (primeiro no escopo local, depois global no formulário)
        function findWithFallback(matchRegex, excludeRegex) {
            let found = findFieldInScope(primaryScope, matchRegex, excludeRegex);
            if (!found && primaryScope !== document) {
                found = findFieldInScope(document, matchRegex, excludeRegex);
            }
            return found;
        }

        const inputRua = findWithFallback(regexRua, excludeRua);
        const inputBairro = findWithFallback(regexBairro, excludeBairro);
        const inputCidade = findWithFallback(regexCidade, excludeCidade);
        const inputUf = findWithFallback(regexUf, excludeUf);
        const inputNumero = findWithFallback(regexNumero, excludeNumero);
        const inputComplemento = findWithFallback(regexComplemento, excludeComplemento);

        let camposPreenchidos = 0;

        if (inputRua && dados.logradouro) {
            setInputValue(inputRua, dados.logradouro);
            camposPreenchidos++;
        }
        if (inputBairro && dados.bairro) {
            setInputValue(inputBairro, dados.bairro);
            camposPreenchidos++;
        }
        if (inputCidade && dados.localidade) {
            setInputValue(inputCidade, dados.localidade);
            camposPreenchidos++;
        }
        if (inputUf && dados.uf) {
            if (inputUf.tagName === 'SELECT') {
                setSelectUf(inputUf, dados.uf);
            } else {
                setInputValue(inputUf, dados.uf);
            }
            camposPreenchidos++;
        }
        if (inputComplemento && dados.complemento && !inputComplemento.value) {
            setInputValue(inputComplemento, dados.complemento);
        }

        console.log(`[ViaCEP] ${camposPreenchidos} campos preenchidos com sucesso.`);

        // Foco automático no campo Número
        if (inputNumero) {
            setTimeout(() => {
                inputNumero.focus();
                if (inputNumero.select) inputNumero.select();
            }, 150);
        }
    }

    /**
     * Consulta a API pública do ViaCEP
     */
    function consultarCep(inputCep, cleanCep) {
        if (!cleanCep || cleanCep.length !== 8) return;
        if (inputCep.dataset.lastCepQuery === cleanCep) return;

        inputCep.dataset.lastCepQuery = cleanCep;
        inputCep.classList.add('viacep-loading');
        inputCep.classList.remove('viacep-success', 'viacep-error');

        showToast('info', `Buscando CEP ${inputCep.value}...`, 1800);

        const url = `https://viacep.com.br/ws/${cleanCep}/json/`;

        fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP status ${response.status}`);
                return response.json();
            })
            .then(data => {
                inputCep.classList.remove('viacep-loading');

                if (data.erro) {
                    inputCep.classList.add('viacep-error');
                    showToast('warning', 'CEP não encontrado na base dos Correios.');
                    return;
                }

                inputCep.classList.add('viacep-success');
                setTimeout(() => inputCep.classList.remove('viacep-success'), 3000);

                preencherEndereco(inputCep, data);

                const info = data.logradouro ? `${data.logradouro} - ${data.localidade}/${data.uf}` : `${data.localidade}/${data.uf}`;
                showToast('success', `Endereço localizado: ${info}`);
            })
            .catch(err => {
                console.error('[ViaCEP] Erro ao consultar CEP:', err);
                inputCep.classList.remove('viacep-loading');
                inputCep.classList.add('viacep-error');
                showToast('error', 'Falha ao conectar com o serviço ViaCEP.');
            });
    }

    /**
     * Interceptador de digitação e formatação de máscara (00000-000)
     */
    function handleInput(e) {
        const target = e.target;
        if (!target || !isCepInput(target)) return;

        target.setAttribute('maxlength', '9');
        target.setAttribute('inputmode', 'numeric');
        if (!target.placeholder) target.placeholder = '00000-000';

        const digits = target.value.replace(/\D/g, '').slice(0, 8);

        // Aplicação da máscara visual dinâmica
        if (digits.length > 5) {
            target.value = digits.slice(0, 5) + '-' + digits.slice(5);
        } else {
            target.value = digits;
        }

        // Disparo automático ao atingir 8 dígitos
        if (digits.length === 8) {
            consultarCep(target, digits);
        } else {
            delete target.dataset.lastCepQuery;
            target.classList.remove('viacep-success', 'viacep-error', 'viacep-loading');
        }
    }

    /**
     * Interceptador de perda de foco (Blur) ou colagem (Paste)
     */
    function handleBlurOrPaste(e) {
        const target = e.target;
        if (!target || !isCepInput(target)) return;

        setTimeout(() => {
            const digits = target.value.replace(/\D/g, '').slice(0, 8);
            if (digits.length === 8) {
                consultarCep(target, digits);
            }
        }, 50);
    }

    // Delegação de eventos no document para suporte completo a modais e AJAX do GLPI 11
    document.addEventListener('input', handleInput, true);
    document.addEventListener('focusout', handleBlurOrPaste, true);
    document.addEventListener('paste', handleBlurOrPaste, true);

})();
