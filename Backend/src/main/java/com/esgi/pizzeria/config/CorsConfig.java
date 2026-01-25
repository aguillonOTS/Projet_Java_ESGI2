package com.esgi.pizzeria.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuration globale du CORS (Cross-Origin Resource Sharing).
 * * <p>Cette classe permet au navigateur d'autoriser les requêtes provenant du Frontend (React)
 * vers ce Backend (Spring Boot), qui sont par défaut bloquées car elles proviennent
 * de ports différents (localhost:5173 vs localhost:8080).</p>
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    /**
     * URL du client Frontend autorisé.
     * NOTE: Pour la production, cette valeur devrait être injectée via @Value depuis application.properties.
     */
    private static final String ALLOWED_FRONTEND_URL = "http://localhost:5173";

    /**
     * Définit les règles de partage des ressources entre origines.
     * * @param registry Le registre CORS de Spring MVC à configurer.
     */
    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        // Configuration appliquée à tous les endpoints de l'API ("/**")
        registry.addMapping("/**")
                // SÉCURITÉ : On autorise uniquement le frontend connu, jamais "*" en production avec des credentials.
                .allowedOrigins(ALLOWED_FRONTEND_URL)
                // Méthodes HTTP standard requises pour une API REST complète
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                // Autorise tous les headers (nécessaire pour les tokens JWT ou Content-Type personnalisés)
                .allowedHeaders("*")
                // SÉCURITÉ : Autorise l'envoi de cookies/headers d'authentification
                // Ceci nécessite impérativement une origine explicite (pas de wildcard "*")
                .allowCredentials(true);
    }
}