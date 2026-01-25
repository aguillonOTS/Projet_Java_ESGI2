package com.esgi.pizzeria.domain;

public enum ProductStatus {
    DRAFT,      // Brouillon (visible uniquement par le cuisinier)
    VALIDATED,  // Validé (prêt à être publié)
    ARCHIVED    // Supprimé logiquement
}