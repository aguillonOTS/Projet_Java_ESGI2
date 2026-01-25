package com.esgi.pizzeria.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SinglePageAppController {

    // Redirige toutes les routes non-API et sans extension (pas .css, .js) vers index.html
    // Cela permet à React Router de prendre le relais
    @RequestMapping(value = "/{path:[^\\.]*}")
    public String redirect() {
        return "forward:/index.html";
    }
}