<?php
/**
 * -----------------------------------------------------------------------------
 * Plugin ViaCEP Formulários para GLPI 10 e 11
 * Autor: Petryck Slater / Revo Infra
 * Finalidade: Consulta e preenchimento automático inteligente de endereços
 *             via API pública ViaCEP em formulários do GLPI.
 * -----------------------------------------------------------------------------
 */

defined('GLPI_ROOT') || die("Sorry. You can't access this file directly");

define('PLUGIN_VIACEP_VERSION', '1.1.0');
define('PLUGIN_VIACEP_MIN_GLPI', '10.0.0');

/**
 * Inicialização e registro dos Hooks do Plugin
 */
function plugin_init_viacep() {
    global $PLUGIN_HOOKS;

    // Conformidade com proteção CSRF do GLPI
    $PLUGIN_HOOKS['csrf_compliant']['viacep'] = true;

    // Injeção de Scripts JS (páginas autenticadas e públicas/anônimas)
    $PLUGIN_HOOKS['add_javascript']['viacep'] = ['js/viacep.js'];
    $PLUGIN_HOOKS['add_javascript_anonymous_page']['viacep'] = ['js/viacep.js'];

    // Injeção de Estilos CSS (feedback visual, spinner e notificações)
    $PLUGIN_HOOKS['add_css']['viacep'] = ['css/viacep.css'];
    $PLUGIN_HOOKS['add_css_anonymous_page']['viacep'] = ['css/viacep.css'];
}

/**
 * Informações de versão e metadados do Plugin
 */
function plugin_version_viacep() {
    return [
        'name'           => 'ViaCEP Formulários',
        'version'        => PLUGIN_VIACEP_VERSION,
        'author'         => 'Petryck Slater (Revo Infra)',
        'license'        => 'GPLv2+',
        'homepage'       => 'https://revoinfra.com.br',
        'minGlpiVersion' => PLUGIN_VIACEP_MIN_GLPI,
        'requirements'   => [
            'glpi' => [
                'min' => PLUGIN_VIACEP_MIN_GLPI,
            ]
        ]
    ];
}

/**
 * Checagem de pré-requisitos antes da instalação
 */
function plugin_viacep_check_prerequisites() {
    return true;
}

/**
 * Checagem de configuração do plugin
 */
function plugin_viacep_check_config($verbose = false) {
    return true;
}
