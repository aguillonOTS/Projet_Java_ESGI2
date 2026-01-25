package com.esgi.pizzeria.repository;

import java.io.File;
import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import com.esgi.pizzeria.domain.ShopSettings;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;

/**
 * Repository unique (Singleton) pour les paramètres globaux du magasin.
 * Ne gère pas une liste, mais un seul objet de configuration.
 */
@Repository
public class JsonSettingsRepository {

    private static final Logger logger = LoggerFactory.getLogger(JsonSettingsRepository.class);
    private static final String FILE_PATH = "Backend/data/settings.json";
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    private ShopSettings settings;

    @PostConstruct
    public void init() {
        File file = new File(FILE_PATH);
        if (file.exists()) {
            try {
                settings = objectMapper.readValue(file, ShopSettings.class);
                logger.info("Paramètres boutique chargés.");
            } catch (IOException e) {
                logger.error("Erreur lecture settings.json", e);
            }
        } else {
            // Configuration par défaut
            settings = new ShopSettings();
            settings.setShopName("Pizzeria ESGI");
            settings.setAddress("12 Rue de la Pizza, Paris");
            settings.setPhone("01 23 45 67 89");
            saveToFile();
            logger.info("Paramètres par défaut générés.");
        }
    }

    public synchronized ShopSettings getSettings() {
        return settings;
    }

    public synchronized void save(ShopSettings newSettings) {
        this.settings = newSettings;
        saveToFile();
    }

    private synchronized void saveToFile() {
        try {
            File file = new File(FILE_PATH);
            if (file.getParentFile() != null) file.getParentFile().mkdirs();
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(file, settings);
        } catch (IOException e) {
            logger.error("Impossible de sauvegarder les paramètres", e);
        }
    }
}