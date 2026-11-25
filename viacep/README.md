# Plugin ViaCEP Formulários - GLPI 10 e 11

Plugin nativo do GLPI para consulta e autopreenchimento dinâmico de endereços utilizando a API pública do ViaCEP.

## Recursos
- Máscara dinâmica de CEP (`00000-000`).
- Compatível 100% com o renderizador nativo de formulários do GLPI 11 (`data-glpi-form-renderer-question`).
- Busca automática por heurística de nomes de perguntas (CEP, Logradouro, Bairro, Cidade, Estado/UF, Número).
- Suporte a `<select>` de UF (por sigla ou nome por extenso do estado).
- Feedback visual com spinner CSS e notificações Toast não-bloqueantes.
- Foco automático no campo de Número após localização do endereço.
