# 🇧🇷 Plugin ViaCEP para GLPI 10 & 11

![GLPI 10](https://img.shields.io/badge/GLPI-10.0.x-blue.svg?style=for-the-badge&logo=php)
![GLPI 11](https://img.shields.io/badge/GLPI-11.0.x-success.svg?style=for-the-badge&logo=php)
![License](https://img.shields.io/badge/License-GPLv2%2B-orange.svg?style=for-the-badge)
![API](https://img.shields.io/badge/API-ViaCEP-brightgreen.svg?style=for-the-badge)

Plugin open-source para **GLPI 10 e GLPI 11** que adiciona consulta assíncrona inteligente e autopreenchimento dinâmico de endereços brasileiros via API pública do **ViaCEP** em formulários nativos do GLPI e Formcreator.

---

## 🚀 Principais Recursos

- **Máscara dinâmica de CEP:** Formata automaticamente em tempo real no padrão `00000-000`.
- **Compatibilidade Nativa com GLPI 11:** 100% integrado com o novo motor **Form Renderer** do GLPI 11 (`data-glpi-form-renderer-question`, seções dinâmicas e UUIDs).
- **Compatibilidade com GLPI 10 & Formcreator:** Suporte a formulários do Formcreator clássico, modais e formulários administrativos.
- **Detecção Inteligente por Heurística:** Localiza os campos de endereço por rótulos (Labels), `aria-label`, IDs e placeholders sem necessidade de configurações complexas.
- **Suporte Avançado a Estados (UF):** Identifica e preenche automaticamente campos `<select>` de UF tanto por sigla (`PB`, `SP`, `RJ`) quanto por nome por extenso (`Paraíba`, `São Paulo`, `Rio de Janeiro`).
- **Feedback Visual Não-Invasivo:**
  - Spinner animado em SVG puro no campo de CEP durante a requisição.
  - Notificações Toast modernas e suaves no canto da tela (Endereço localizado, CEP não encontrado ou inválido).
- **Foco Automático:** Após preencher Rua, Bairro, Cidade e Estado, o cursor pula automaticamente para o campo de **Número**, economizando tempo do usuário.
- **Arquitetura 100% Client-Side:**
  - Zero impacto no banco de dados (não cria tabelas nem colunas no MySQL/MariaDB).
  - Execução via `fetch()` assíncrono no navegador, sem sobrecarregar as threads do PHP-FPM do servidor.

---

## 📋 Mapeamento Automático de Campos

O plugin reconhece automaticamente as seguintes palavras-chave em seus formulários:

| Campo do Formulário | Heurísticas / Palavras-chave Detectadas |
| :--- | :--- |
| **CEP** | `cep`, `c.e.p`, `código postal`, `zipcode`, `postal code` |
| **Logradouro / Rua** | `logradouro`, `endereço`, `rua`, `avenida`, `av.`, `endereco`, `street` |
| **Bairro** | `bairro`, `distrito`, `neighborhood` |
| **Cidade** | `cidade`, `município`, `municipio`, `city` |
| **Estado / UF** | `estado`, `uf`, `unidade federativa`, `província`, `state` |
| **Número** | `número`, `numero`, `nº`, `num`, `number` |
| **Complemento** | `complemento`, `compl`, `apto`, `sala`, `bloco` |

---

## 📦 Instalação

### Opção 1: Git Clone
Acesse o diretório de plugins da sua instalação do GLPI:
```bash
cd /var/www/html/glpi/plugins
git clone https://github.com/PetryckSlater/glpi-plugin-viacep.git viacep
chown -R www-data:www-data viacep
```

### Opção 2: Download do Release
1. Baixe o arquivo `.zip` da última versão na aba [Releases](../../releases).
2. Extraia o conteúdo dentro do diretório `plugins/` do seu GLPI, garantindo que o diretório se chame exatamente **`viacep`**:
   ```text
   glpi/
   └── plugins/
       └── viacep/
           ├── setup.php
           ├── hook.php
           ├── css/
           └── js/
   ```
3. No painel do GLPI, acesse **Configurar > Plugins**.
4. Localize **ViaCEP Formulários**, clique em **Instalar** e em seguida em **Ativar**.

---

## 🛠️ Como Usar nos Formulários

1. Crie ou edite um formulário no GLPI (ou no plugin Formcreator).
2. Adicione as perguntas de endereço com títulos claros (ex: *"CEP"*, *"Endereço"*, *"Bairro"*, *"Cidade"*, *"UF"* e *"Número"*).
3. Ao abrir o formulário público ou autenticado, digite os 8 dígitos do CEP:
   - A máscara `00000-000` é aplicada automaticamente.
   - O spinner animado é exibido.
   - Os campos de Rua, Bairro, Cidade e UF são preenchidos instantaneamente.
   - O foco pula para o campo de Número!

---

## 💻 Tecnologias Utilizadas

- **PHP 8.1+**: Registro de hooks, compatibilidade CSRF e injeção assíncrona.
- **Vanilla JavaScript (ES6+)**: Zero dependências pesadas como jQuery ou frameworks externos.
- **CSS3 Moderno**: Animações de spinner em SVG base64 e Toast Notifications nativas.
- **ViaCEP API**: WebService público gratuito com suporte HTTPS e alta disponibilidade.

---

## 📄 Licença

Distribuído sob a licença **GPLv2+**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor & Créditos

Desenvolvido com 💙 por **Petryck Slater**  
- GitHub: [@petryckslater](https://github.com/petryckslater)
- Portfólio / Projetos: [Revo Infra](https://revoinfra.com.br)
