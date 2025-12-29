import { type Response, type NextFunction } from "express";
import HttpStatus from "http-status";
import { ProductReview } from "../entities/product.reviews.entities.js";
import * as ejv from "express-joi-validation";
import { MySQLDataSource } from "../data-source.js";
import {
  type AuthenticatedResponse,
  type ListRequestSchema,
} from "../utils/interface.js";
import Joi from "joi";

const reviewRepository = MySQLDataSource.getRepository(ProductReview);

export interface ICreateReview {
  productId: number;
  userId: number;
  rating: number;
  comment?: string;
  isActive?: boolean;
}

export const createReviewBodySchema = Joi.object<ICreateReview>({
  productId: Joi.number().integer().positive().required(),

  userId: Joi.number().integer().positive().required(),

  rating: Joi.number().min(1).max(5).required(),

  comment: Joi.string().allow(null, "").optional(),

  isActive: Joi.boolean().default(true),
}).required();

export interface CreateReviewRequestSchema extends ejv.ValidatedRequestSchema {
  [ejv.ContainerTypes.Body]: ICreateReview;
}

export async function createReview(
  req: ejv.ValidatedRequest<CreateReviewRequestSchema>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const payload: Partial<ProductReview> = {
      product: { id: req.body.productId },
      user: { id: req.body.userId },
      rating: req.body.rating,
      comment: req.body.comment ?? "",
      isActive: req.body.isActive ?? true,
    };

    await reviewRepository.insert(payload);

    res.status(HttpStatus.CREATED).json({
      message: "Review created successfully",
    });
  } catch (error) {
    next(error);
  }
}

interface ReviewParams {
  reviewId: number;
}

interface IUpdateReviewBody {
  rating?: number;
  comment?: string | null;
  isActive?: boolean;
}
const reviewParamSchema = Joi.object<ReviewParams>({
  reviewId: Joi.number().integer().positive().required(),
});

export interface UpdateReviewRequestSchema extends ejv.ValidatedRequestSchema {
  [ejv.ContainerTypes.Params]: ReviewParams;
  [ejv.ContainerTypes.Body]: IUpdateReviewBody;
}

const updateReviewBodySchema = Joi.object<IUpdateReviewBody>({
  rating: Joi.number().min(1).max(5).optional(),
  comment: Joi.string().allow(null, "").optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

export async function updateReview(
  req: ejv.ValidatedRequest<UpdateReviewRequestSchema> & Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reviewId = Number(req.params.reviewId);

    const product = await reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!product) {
      res.status(HttpStatus.NOT_FOUND).json({
        message: "Product not found",
      });
      return;
    }

    const updateData: Partial<ProductReview> = {
      ...(req.body.rating !== undefined && { rating: req.body.rating }),
      ...(req.body.comment !== undefined && {
        comment: req.body.comment || undefined,
      }),
      ...(req.body.isActive !== undefined && {
        isActive: req.body.isActive,
      }),
    };

    await reviewRepository.update({ id: reviewId }, updateData);

    res.status(HttpStatus.OK).json({
      message: "Review updated successfully",
    });
  } catch (error) {
    next(error);
  }
}

interface DeleteReviewRequestSchema extends ejv.ValidatedRequestSchema {
  [ejv.ContainerTypes.Params]: ReviewParams;
}

export async function deleteReview(
  req: ejv.ValidatedRequest<DeleteReviewRequestSchema>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { reviewId } = req.params;

    await reviewRepository.delete({ id: reviewId });

    res.status(HttpStatus.OK).json({
      message: "Review deleted Permanently successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function getReviews(
  req: ejv.ValidatedRequest<ListRequestSchema<ProductReview>> & Request,
  res: AuthenticatedResponse,
  next: NextFunction
): Promise<void> {
  try {
    const { filters, fields, sort, populates } = req.query;

    const limit = req.query.limit ?? 10;
    const page = req.query.page ?? 0;

    const reviews = await reviewRepository.find({
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

    const count = await reviewRepository.count({
      where: filters,
    });

    res.status(HttpStatus.OK).json({
      message: "Reviews fetched successfully",
      data: reviews,
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
  createReviewBodySchema,
  createReview,
  reviewParamSchema,
  updateReviewBodySchema,
  updateReview,
  deleteReview,
  getReviews,
};
