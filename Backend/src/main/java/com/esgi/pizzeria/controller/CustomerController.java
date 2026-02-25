package com.esgi.pizzeria.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.esgi.pizzeria.domain.Customer;
import com.esgi.pizzeria.service.CustomerService;

/**
 * Contrôleur REST pour la gestion des clients et du programme de fidélité.
 */
@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService service;

    public CustomerController(CustomerService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<Customer>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Customer> getById(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<Customer> searchByPhone(@RequestParam String phone) {
        return service.findByPhone(phone)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Customer> save(@RequestBody Customer customer) {
        if (customer == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(service.save(customer));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Retourne la configuration du programme de fidélité.
     * Le frontend utilise ces valeurs — aucune constante métier ne doit être hardcodée côté JS.
     */
    @GetMapping("/loyalty-config")
    public ResponseEntity<Map<String, Object>> getLoyaltyConfig() {
        Map<String, Object> config = new java.util.LinkedHashMap<>();
        config.put("pointsPerEuro",         CustomerService.POINTS_PER_EURO);
        config.put("redemptionStep",        CustomerService.POINTS_PER_REDEMPTION);
        config.put("discountPerRedemption", CustomerService.DISCOUNT_PER_REDEMPTION);
        config.put("autoDiscountRate",      CustomerService.AUTO_DISCOUNT_RATE);
        config.put("autoDiscountThreshold", CustomerService.AUTO_DISCOUNT_THRESHOLD);
        return ResponseEntity.ok(config);
    }

    /**
     * Utilise des points de fidélité d'un client.
     * Body attendu : { "points": 100 }
     * Retourne : { "discountAmount": 5.00 }
     */
    @PostMapping("/{id}/redeem")
    public ResponseEntity<Map<String, BigDecimal>> redeemPoints(
            @PathVariable String id,
            @RequestBody Map<String, Integer> body) {
        Integer points = body.get("points");
        if (points == null || points <= 0) {
            return ResponseEntity.badRequest().build();
        }

        try {
            BigDecimal discount = service.redeemPoints(id, points);
            return ResponseEntity.ok(Map.of("discountAmount", discount));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
