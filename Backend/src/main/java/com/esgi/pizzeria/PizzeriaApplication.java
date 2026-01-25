package com.esgi.pizzeria;

import java.awt.Desktop;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;

/**
 * Point d'entrée principal de l'application Spring Boot "Pizzeria".
 * <p>
 * Cette classe est responsable du démarrage du contexte Spring, de l'initialisation
 * des composants (Beans) et, pour le confort de développement, de l'ouverture
 * automatique du navigateur par défaut.
 * </p>
 */
@SpringBootApplication
public class PizzeriaApplication {

    private static final Logger logger = LoggerFactory.getLogger(PizzeriaApplication.class);

    // Injection de l'environnement pour récupérer la configuration (ex: server.port)
    private final Environment environment;

    /**
     * Injection de dépendance par constructeur.
     * @param environment Permet d'accéder aux propriétés de configuration (application.properties).
     */
    public PizzeriaApplication(Environment environment) {
        this.environment = environment;
    }

    public static void main(String[] args) {
        SpringApplication.run(PizzeriaApplication.class, args);
    }

    /**
     * Écouteur d'événement déclenché une fois que l'application est totalement démarrée.
     * <p>
     * Rôle : Améliorer l'expérience développeur (DX) en ouvrant automatiquement
     * l'interface Swagger ou le Frontend au lancement.
     * </p>
     *
     * @param event L'événement signalant que le contexte est prêt.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady(ApplicationReadyEvent event) {
        // Récupération dynamique du port (8080 par défaut si non spécifié)
        String port = environment.getProperty("server.port", "8080");
        String contextPath = environment.getProperty("server.servlet.context-path", "");
        String url = String.format("http://localhost:%s%s", port, contextPath);

        logger.info("Application Pizzeria démarrée avec succès ! URL : {}", url);

        openBrowser(url);
    }

    /**
     * Tente d'ouvrir l'URL donnée dans le navigateur par défaut du système.
     * <p>
     * Gère les spécificités des OS (Windows vs autres) et ignore silencieusement
     * l'opération si l'environnement est "Headless" (ex: Serveur Linux, Docker).
     * </p>
     *
     * @param url L'adresse web à ouvrir.
     */
    private void openBrowser(String url) {
        // Vérification : Ne rien faire si nous sommes sur un serveur sans interface graphique
        if (java.awt.GraphicsEnvironment.isHeadless()) {
            return;
        }

        try {
            if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                // Méthode standard Java AWT (Cross-platform)
                Desktop.getDesktop().browse(new URI(url));
            } else {
                // Fallback spécifique Windows (utile si AWT échoue parfois sous Windows)
                // Note : L'usage de Runtime/ProcessBuilder est acceptable ici pour un outil dev,
                // mais à éviter pour de la logique métier critique.
                String os = System.getProperty("os.name").toLowerCase();
                if (os.contains("win")) {
                    new ProcessBuilder("rundll32", "url.dll,FileProtocolHandler", url).start();
                }
            }
        } catch (IOException | URISyntaxException e) {
            // On log en WARN car ce n'est pas critique pour le fonctionnement de l'API
            logger.warn("Impossible d'ouvrir le navigateur automatiquement : {}", e.getMessage());
        }
    }
}