package com.esgi.pizzeria.domain;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Représente une boisson (produit fini sans assemblage).
 */
public class Drink extends Product {

    private int volumeCl;

    @JsonProperty("isAlcoholic")
    private boolean isAlcoholic;

    public Drink() {
        super();
    }

    /**
     * Constructeur utilitaire.
     * @param price Note : Préférer passer un BigDecimal ou String pour éviter les imprécisions du double.
     */
    public Drink(String name, double price, int volumeCl, boolean isAlcoholic) {
        super(name, BigDecimal.valueOf(price));
        this.volumeCl = volumeCl;
        this.isAlcoholic = isAlcoholic;
    }

    // --- GETTERS & SETTERS ---

    public int getVolumeCl() { return volumeCl; }
    public void setVolumeCl(int volumeCl) { this.volumeCl = volumeCl; }

    @JsonProperty("isAlcoholic")
    public boolean isAlcoholic() { return isAlcoholic; }

    @JsonProperty("isAlcoholic")
    public void setAlcoholic(boolean alcoholic) { isAlcoholic = alcoholic; }
}