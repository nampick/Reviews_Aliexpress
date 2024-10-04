import { json } from "@remix-run/node";
import { prisma } from "../server/db.server"; // Đảm bảo đường dẫn đúng
import { createObjectCsvStringifier } from "csv-writer";

export async function action({ request }) {
  try {
    const formData = await request.formData();
    const actionType = formData.get("_actionType");
    const productId = formData.get("productId");
    const fileName = formData.get("fileName") || "reviews"; // Giá trị mặc định cho tên file

    if (actionType !== "download" || !productId) {
      return json(
        { error: "Invalid action type or missing productId" },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: { productId: productId },
    });

    // Tạo CSV Stringifier
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: "userName", title: "User Name" },
        { id: "userAvatar", title: "User Avatar" },
        { id: "userContry", title: "User Country" },
        { id: "productImage", title: "Product Image" },
        { id: "reviewContent", title: "Review Content" },
        { id: "rating", title: "Rating" },
      ],
    });

    // Chuyển đổi dữ liệu review thành định dạng phù hợp cho CSV
    const records = reviews.map((review) => ({
      userName: review.userName || "",
      userAvatar: review.userAvatar || "",
      userContry: review.userContry || "",
      productImage: review.productImage || "",
      reviewContent: review.reviewContent || "",
      rating: review.rating || "",
    }));

    // Tạo nội dung CSV từ dữ liệu
    const csvContent =
      csvStringifier.getHeaderString() +
      csvStringifier.stringifyRecords(records);

    // Trả về nội dung CSV thay vì file
    return json({ csvContent, fileName });
  } catch (error) {
    console.error("Error exporting reviews:", error);
    return json(
      { error: "An error occurred while exporting reviews" },
      { status: 500 }
    );
  }
}
