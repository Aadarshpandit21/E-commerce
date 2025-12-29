import { type NextFunction, type Request, type Response } from "express";
import HttpStatus from "http-status";
import type ejv from "express-joi-validation";
import Joi from "joi";

import { MySQLDataSource } from "../data-source.js";
import { Category } from "../entities/categories.entities.js";
import {
  type AuthenticatedResponse,
  type ListRequestSchema,
} from "../utils/interface.js";

const categoryRepository = MySQLDataSource.getRepository(Category);

export interface ICreateCategory {
  name: string;
  slug: string;
  description?: string;
  images?: string;
  isActive?: boolean;
}
export const createCategoryBodySchema = Joi.array()
  .items(
    Joi.object({
      name: Joi.string().trim().min(2).max(255).required(),

      slug: Joi.string().trim().max(255).required(),

      description: Joi.string().allow(null, "").optional(),

      images: Joi.string().allow(null, "").optional(),

      isActive: Joi.boolean().default(true),
    })
  )
  .min(1)
  .required();

export interface CreateCategoryRequestSchema
  extends ejv.ValidatedRequestSchema {
  [ejv.ContainerTypes.Body]: ICreateCategory[];
}

export async function createCategory(
  req: ejv.ValidatedRequest<CreateCategoryRequestSchema>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const payload: Array<Partial<Category>> = req.body.map((item) => ({
      name: item.name,
      slug: item.slug,
      description: item.description ?? "",
    }));

    if (payload.length > 0) {
      await categoryRepository.insert(payload);
    }

    res.status(HttpStatus.CREATED).json({
      message: "Categories created successfully",
    });
  } catch (error) {
    next(error);
  }
}

interface UpdateCategoryBody {
  name?: string;
  description?: string | null;
  slug?: string;
  isActive?: boolean;
}

interface categoryParams {
  categoryId: number;
}

const categoryParamBody = Joi.object<categoryParams>({
  categoryId: Joi.number().integer().positive().required(),
});

const updateCategoryBodySchema = Joi.object<UpdateCategoryBody>({
  name: Joi.string().trim().min(2).max(255).optional(),
  description: Joi.string().allow(null, "").optional(),
  slug: Joi.string().trim().max(255).optional(),
  isActive: Joi.boolean().optional(),
});

interface UpdateCategoryRequestSchema extends ejv.ValidatedRequestSchema {
  [ejv.ContainerTypes.Body]: Partial<Category>;
  [ejv.ContainerTypes.Params]: categoryParams;
}

async function updateCategory(
  req: ejv.ValidatedRequest<UpdateCategoryRequestSchema> & Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { categoryId } = req.params;
    const { name, slug, isActive, description } = req.body as Partial<Category>;
    const category = await categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (category === null) {
      res.status(HttpStatus.NOT_FOUND).json({
        message: "Category not found",
      });
      return;
    }

    const updateData: Partial<Category> = {};
    if (name !== null && name !== undefined) updateData.name = name;
    if (slug !== null && slug !== undefined) updateData.slug = slug;
    if (description !== null && description !== undefined)
      updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (Object.keys(updateData).length === 0) {
      res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: "No valid fields provided for update" });
      return;
    }

    await categoryRepository.update({ id: categoryId }, updateData);

    res.status(HttpStatus.OK).json({
      message: "Category updated successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function getCategories(
  req: ejv.ValidatedRequest<ListRequestSchema<Category>> & Request,
  res: AuthenticatedResponse,
  next: NextFunction
): Promise<void> {
  try {
    const { filters, fields, sort, populates } = req.query;

    const limit = req.query.limit ?? 10;
    const page = req.query.page ?? 0;

    const categories = await categoryRepository.find({
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

    const count = await categoryRepository.count({
      where: filters,
    });

    res.status(HttpStatus.OK).json({
      message: "Categories fetched successfully",
      data: categories,
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
  createCategoryBodySchema,
  createCategory,
  updateCategoryBodySchema,
  categoryParamBody,
  updateCategory,
  getCategories,
};
