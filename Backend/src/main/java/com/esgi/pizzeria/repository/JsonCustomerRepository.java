package com.esgi.pizzeria.repository;

import com.esgi.pizzeria.domain.Customer;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Repository
public class JsonCustomerRepository {

    private static final Logger logger = LoggerFactory.getLogger(JsonCustomerRepository.class);
    private static final String FILE_PATH = "Backend/data/customers.json";
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // CORRECTION : Ajout de 'final' pour sécuriser le bloc synchronized plus bas
    private final List<Customer> database = Collections.synchronizedList(new ArrayList<>());

    @PostConstruct
    public void init() {
        File file = new File(FILE_PATH);
        if (file.exists()) {
            try {
                List<Customer> loaded = objectMapper.readValue(file, new TypeReference<List<Customer>>() {});
                // On modifie le contenu de la liste final, pas la référence elle-même
                database.clear();
                database.addAll(loaded);
                logger.info("{} clients chargés depuis le fichier.", database.size());
            } catch (IOException e) {
                logger.error("Echec de la lecture de customers.json", e);
            }
        } else {
            saveToFile();
        }
    }

    private synchronized void saveToFile() {
        try {
            File file = new File(FILE_PATH);
            if (file.getParentFile() != null && !file.getParentFile().exists()) {
                file.getParentFile().mkdirs();
            }
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(file, database);
        } catch (IOException e) {
            logger.error("ERREUR CRITIQUE : Impossible de sauvegarder les clients", e);
        }
    }

    public List<Customer> findAll() {
        return new ArrayList<>(database);
    }

    public Optional<Customer> findByPhone(String phone) {
        // CORRECTION : Maintenant sûr car 'database' est final
        synchronized (database) {
            return database.stream()
                    .filter(c -> c.getPhone().equals(phone))
                    .findFirst();
        }
    }

    public synchronized Customer save(Customer customer) {
        database.removeIf(c -> c.getId().equals(customer.getId()));
        database.add(customer);
        saveToFile();
        return customer;
    }
}