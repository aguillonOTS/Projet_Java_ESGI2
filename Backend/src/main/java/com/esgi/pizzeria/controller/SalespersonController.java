package com.esgi.pizzeria.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.esgi.pizzeria.domain.Salesperson;
import com.esgi.pizzeria.service.SalespersonService;

/**
 * Contrôleur REST gérant les comptes des vendeurs/employés.
 */
@RestController
@RequestMapping("/api/salespersons")
public class SalespersonController {

    private final SalespersonService service;

    public SalespersonController(SalespersonService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<Salesperson>> getAll() {
        // SÉCURITÉ : Idéalement, on devrait renvoyer des DTOs sans le champ 'pinCode'.
        // Pour ce TP, on renvoie l'objet, mais le PIN est désormais haché, donc inexploitable directement.
        return ResponseEntity.ok(service.findAll());
    }

    @PostMapping
    public ResponseEntity<Salesperson> save(@RequestBody Salesperson salesperson) {
        if (salesperson == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(service.save(salesperson));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Endpoint d'authentification sécurisé.
     * Remplace la vérification côté client.
     */
    @PostMapping("/login")
    public ResponseEntity<Boolean> login(@RequestBody Map<String, String> credentials) {
        String id = credentials.get("id");
        String pin = credentials.get("pinCode");

        if (id == null || pin == null) {
            return ResponseEntity.badRequest().build();
        }

        boolean isValid = service.verifyPin(id, pin);
        
        if (isValid) {
            return ResponseEntity.ok(true);
        } else {
            // Pour la sécurité, on renvoie 401 Unauthorized plutôt que false
            return ResponseEntity.status(401).body(false);
        }
    }
}