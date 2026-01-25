package com.esgi.pizzeria.domain;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Représente un plat préparé (ex: Pizza).
 * <p>
 * Contient une liste d'ingrédients.
 * </p>
 */
public class Dish extends Product {

    /**
     * Liste des ID des ingrédients ou noms.
     * Initialisation par défaut pour éviter les NullPointerException.
     */
    private List<String> ingredients = new ArrayList<>();
    
    private boolean isVegetarian;

    public Dish() {
        super();
    }

    public Dish(String name, BigDecimal price, boolean isVegetarian) {
        super(name, price);
        this.isVegetarian = isVegetarian;
    }

    // --- GETTERS & SETTERS ---

    public List<String> getIngredients() { return ingredients; }
    public void setIngredients(List<String> ingredients) { this.ingredients = ingredients; }

    public boolean isVegetarian() { return isVegetarian; }
    public void setVegetarian(boolean vegetarian) { isVegetarian = vegetarian; }
}