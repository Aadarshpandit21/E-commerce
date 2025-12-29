import { Router } from "express";
import accounts from "./account.route.js";
import categories from "./categories.routes.js";
import products from "./products.routes.js";
// import productReview from "./product.review.route.js";

const $ = Router();

$.use(accounts);
$.use(categories);
$.use(products);
// $.use(productReview);
// Define your routes here
$.get("/", (_req, res) => {
  res.send("Welcome to the E-Commerce API");
});



export default $;
