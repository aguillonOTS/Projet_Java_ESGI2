package com.esgi.pizzeria.repository;

import com.esgi.pizzeria.domain.Product;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Repository
public class JsonProductRepository {

    private static final Logger logger = LoggerFactory.getLogger(JsonProductRepository.class);
    private static final String FILE_PATH = "Backend/data/pizzeria-data.json";
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // CORRECTION : Ajout de 'final'
    private final List<Product> database = Collections.synchronizedList(new ArrayList<>());

    @PostConstruct
    public void init() {
        File file = new File(FILE_PATH);
        if (file.exists()) {
            try {
                List<Product> loaded = objectMapper.readValue(file, new TypeReference<List<Product>>() {});
                database.clear();
                database.addAll(loaded);
                logger.info("{} produits chargés.", database.size());
            } catch (IOException e) {
                logger.error("Erreur lecture catalogue produits", e);
            }
        }

        if (database.isEmpty()) {
            seedData();
        }
    }

    private void seedData() {
        logger.info("Importation du catalogue par défaut...");
        try (InputStream inputStream = getClass().getResourceAsStream("/initial-products.json")) {
            if (inputStream != null) {
                List<Product> seeds = objectMapper.readValue(inputStream, new TypeReference<List<Product>>() {});
                database.addAll(seeds);
                saveToFile();
                logger.info("Catalogue initialisé avec {} produits.", seeds.size());
            } else {
                logger.error("Fichier seed 'initial-products.json' manquant !");
            }
        } catch (IOException e) {
            logger.error("Erreur importation catalogue", e);
        }
    }

    private synchronized void saveToFile() {
        try {
            File file = new File(FILE_PATH);
            if (file.getParentFile() != null) file.getParentFile().mkdirs();
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(file, database);
        } catch (IOException e) {
            logger.error("Erreur sauvegarde catalogue", e);
        }
    }

    public List<Product> findAll() { return new ArrayList<>(database); }

    public Optional<Product> findById(String id) {
        synchronized (database) {
            return database.stream().filter(p -> p.getId().equals(id)).findFirst();
        }
    }

    public synchronized Product save(Product product) {
        database.removeIf(p -> p.getId().equals(product.getId()));
        database.add(product);
        saveToFile();
        return product;
    }

    public synchronized void deleteById(String id) {
        if (database.removeIf(p -> p.getId().equals(id))) {
            saveToFile();
        }
    }
}