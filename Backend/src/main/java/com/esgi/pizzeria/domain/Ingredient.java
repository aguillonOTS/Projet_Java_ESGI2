package com.esgi.pizzeria.domain;

import java.math.BigDecimal;

/**
 * Ingrédient élémentaire composant une pizza (ex: Tomate, Mozzarella).
 */
public class Ingredient {
    
    private String id;
    private String name;
    
    // Le stock peut rester en double (ex: 1.5 kg), mais attention aux arrondis.
    private double stock; 
    
    // ROBUSTESSE : Changement de double -> BigDecimal pour le prix.
    private BigDecimal unitPrice;
    
    private String unit; // ex: "kg", "l", "unité"
    private String category;

    public Ingredient() {}

    // --- GETTERS & SETTERS ---

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getStock() { return stock; }
    public void setStock(double stock) { this.stock = stock; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}