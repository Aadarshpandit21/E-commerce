import { type NextFunction, type Request, type Response } from "express";
import HttpStatus from "http-status";
import type ejv from "express-joi-validation";
import Joi from "joi";

import { MySQLDataSource } from "../data-source.js";
import { Products } from "../entities/product.entities.js";
import {
  type AuthenticatedResponse,
  type ListRequestSchema,
} from "../utils/interface.js";
import { Category } from "../entities/categories.entities.js";

const productsRepository = MySQLDataSource.getRepository(Products);
const categoryRepository = MySQLDataSource.getRepository(Category);

export interface ICreateProduct {
  name: string;
  price: number;
  description?: string;
  stock: number;
  rating?: number;
  reviewCount?: number;
  ingredients?: string;
  usage?: string;
  isActive?: boolean;
}
export const createProductBodySchema = Joi.object({
  categoryId: Joi.number().integer().positive().required(),

  products: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().trim().min(2).max(255).required(),

        price: Joi.number().positive().precision(2).required(),

        description: Joi.string().allow("", null).optional(),

        stock: Joi.number().integer().min(0).required(),

        ingredients: Joi.string().allow("", null).optional(),

        usage: Joi.string().allow("", null).optional(),

        isActive: Joi.boolean().default(true),
      })
    )
    .min(1)
    .required(),
});

export interface CreateProductRequestSchema extends ejv.ValidatedRequestSchema {
  [ejv.ContainerTypes.Body]: {
    categoryId: number;
    products: ICreateProduct[];
  };
}

export async function createProduct(
  req: ejv.ValidatedRequest<CreateProductRequestSchema>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { categoryId, products } = req.body;
    const category = await categoryRepository.exists({
      where: { id: categoryId },
    });

    if (!category) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: "Invalid categoryId",
      });
      return;
    }

    const payload: Array<Partial<Products>> = products.map((item) => ({
      name: item.name,
      price: item.price,
      description: item.description ?? "",
      stock: item.stock,
      ingredients: item.ingredients ?? "",
      usage: item.usage ?? "",
      isActive: item.isActive ?? true,
      categoryId,
    }));

    await productsRepository.insert(payload);

    res.status(HttpStatus.CREATED).json({
      message: "Products created successfully",
    });
  } catch (error) {
    next(error);
  }
}

interface UpdateProductBody {
  name?: string;
  description?: string | null;
  price?: number;
  stock?: number;
  ingredients?: string | null;
  usage?: string | null;
  isActive?: boolean;
}

interface ProductParams {
  productId: number;
}
const productParamSchema = Joi.object<ProductParams>({
  productId: Joi.number().integer().positive().required(),
});

const updateProductBodySchema = Joi.object<UpdateProductBody>({
  name: Joi.string().trim().min(2).max(255).optional(),

  description: Joi.string().allow("", null).optional(),

  price: Joi.number().positive().precision(2).optional(),

  stock: Joi.number().integer().min(0).optional(),

  ingredients: Joi.string().allow("", null).optional(),

  usage: Joi.string().allow("", null).optional(),

  isActive: Joi.boolean().optional(),
}).min(1);

interface UpdateProductRequestSchema extends ejv.ValidatedRequestSchema {
  [ejv.ContainerTypes.Body]: UpdateProductBody;
  [ejv.ContainerTypes.Params]: ProductParams;
}

export async function updateProduct(
  req: ejv.ValidatedRequest<UpdateProductRequestSchema> & Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { productId } = req.params;
    const body = req.body;

    const product = await productsRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      res.status(HttpStatus.NOT_FOUND).json({
        message: "Product not found",
      });
      return;
    }

    const updateData: Partial<Products> = {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && {
        description: body.description ?? undefined,
      }),
      ...(body.price !== undefined && { price: body.price }),
      ...(body.stock !== undefined && { stock: body.stock }),
      ...(body.ingredients !== undefined && {
        ingredients: body.ingredients ?? undefined,
      }),
      ...(body.usage !== undefined && { usage: body.usage ?? undefined }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    };

    await productsRepository.update({ id: productId }, updateData);

    res.status(HttpStatus.OK).json({
      message: "Product updated successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function getProducts(
  req: ejv.ValidatedRequest<ListRequestSchema<Products>> & Request,
  res: AuthenticatedResponse,
  next: NextFunction
): Promise<void> {
  try {
    const { filters, fields, sort, populates } = req.query;

    const limit = req.query.limit ?? 10;
    const page = req.query.page ?? 0;

    const products = await productsRepository.find({
      where: filters,
      select: fields,
      relations: Array.isArray(populates)
        ? populates
        : populates
        ? [populates]
        : [],
      order: sort,
      take: limit,
      skip: limit * page,
    });

    const count = await productsRepository.count({
      where: filters,
    });

    res.status(HttpStatus.OK).json({
      message: "Products fetched successfully",
      data: products,
      pagination: {
        total: count,
        page,
        limit,
      },
    });
    return;
  } catch (error) {
    next(error);
  }
}

export default {
  createProductBodySchema,
  createProduct,
  productParamSchema,
  updateProductBodySchema,
  updateProduct,
  getProducts,
};
