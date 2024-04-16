import mongoose from "mongoose";
import {products} from "./data.js";
import product from '../models/product.js';

const seedProducts = async () => {
    try {

        await mongoose.connect("mongodb+srv://anandkumarpg359:lwRBXmDCCEFg0koV@cluster0.80fw7po.mongodb.net/");
        await product.deleteMany();
        console.log('products are deleted');

        await product.insertMany(products)
        console.log('products are added');

        process.exit();
    } catch (error) {

        console.log(error.message);
        process.exit();

    }
};

seedProducts();
