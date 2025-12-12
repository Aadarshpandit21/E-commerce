import { Router } from "express";

const $ = Router();

// Define your routes here
$.get("/", (_req, res) => {
  res.send("Welcome to the E-Commerce API");
});



export default $;
