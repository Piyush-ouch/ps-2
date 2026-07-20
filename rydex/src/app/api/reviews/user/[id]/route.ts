import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import Review from "@/models/review.model";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const { id: userId } = await params;

    const user = await User.findById(userId).select(
      "name role averageRating totalRatings ratingSum isRatingBlocked createdAt"
    );

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const skip = (page - 1) * limit;

    // Fetch reviews where this user is the reviewee
    const reviews = await Review.find({ reviewee: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("reviewer", "name role");

    // Aggregate rating breakdown (distribution of 1 to 5 stars)
    const breakdownAggregation = await Review.aggregate([
      { $match: { reviewee: user._id } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]);

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    breakdownAggregation.forEach((item) => {
      ratingDistribution[item._id] = item.count;
    });

    // Aggregate top feedback tags
    const tagsAggregation = await Review.aggregate([
      { $match: { reviewee: user._id } },
      { $unwind: "$feedbackTags" },
      { $group: { _id: "$feedbackTags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    const topTags = tagsAggregation.map((t) => ({ tag: t._id, count: t.count }));

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        averageRating: user.averageRating ?? 5.0,
        totalRatings: user.totalRatings ?? 0,
        isRatingBlocked: user.isRatingBlocked ?? false,
      },
      ratingDistribution,
      topTags,
      reviews,
      pagination: {
        page,
        limit,
      },
    });
  } catch (error: any) {
    console.error("Error fetching user ratings:", error);
    return NextResponse.json(
      { message: "Failed to fetch user rating summary." },
      { status: 500 }
    );
  }
}
