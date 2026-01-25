package com.esgi.pizzeria.domain;

import java.math.BigDecimal;

/**
 * Ligne de commande (ex: "2x Pizza Reine").
 */
public class OrderLine {
    private String id;
    private String name;
    
    // ROBUSTESSE : Prix figé au moment de la commande (BigDecimal).
    private BigDecimal price;
    
    private int quantity;
    private String type; // "DISH" ou "DRINK"

    // --- GETTERS & SETTERS ---

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}