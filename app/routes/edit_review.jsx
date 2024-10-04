import { useSearchParams } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { prisma } from "../server/db.server";
import "../styles/edit_review.css";
import UploadWidget from "../layouts/uploadimage";
import { useState } from "react";
import { Button } from "@nextui-org/react";
import { Toaster, toast } from "sonner";
export const action = async ({ request }) => {
  const formData = await request.formData();
  const reviewId = formData.get("reviewId");
  const name = formData.get("name");
  const country = formData.get("country");
  const content = formData.get("content");
  const rating = formData.get("rating");
  const url = formData.get("url");

  // Thực hiện cập nhật review trong cơ sở dữ liệu
  try {
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        productImage: url,
        userName: name,
        userContry: country,
        reviewContent: content,
        rating: rating,
      },
    });

    // Sau khi cập nhật thành công, chuyển hướng về trang danh sách reviews
    return redirect("/Home?tab=Reviews");
  } catch (error) {
    console.error("Failed to update review:", error);
    return json({ error: "Failed to update review" }, { status: 500 });
  }
};

export default function EditReview() {
  const [searchParams] = useSearchParams();
  const reviewId = searchParams.get("reviewId");
  const name = searchParams.get("name");
  const country = searchParams.get("country");
  const content = searchParams.get("content");
  const rating = searchParams.get("rating");
  const [imageUrl, setImageUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function handleUpload(url, error) {
    if (error) {
      setErrorMessage("Upload failed: " + error.message);
      setImageUrl("");
    } else {
      setImageUrl(url);
      setErrorMessage("");
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    event.target.submit();
  }

  return (
    <>
      <div className="modal-overlay2">
        <div className="form-container2">
          <h1>Edit Review</h1>
          <label>
            <label>Image URL:</label>
            <UploadWidget onUpload={handleUpload} />
            {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
            {imageUrl && (
              <div>
                <h3>Image:</h3>
                <img
                  src={imageUrl}
                  alt="Uploaded"
                  height={"100px"}
                  width={"100px"}
                />
              </div>
            )}
          </label>
          <form method="post" onSubmit={handleSubmit}>
            <input type="hidden" name="reviewId" value={reviewId} />

            <label>
              Name:
              <input type="text" name="name" defaultValue={name} />
            </label>
            <label>
              <input type="hidden" name="url" value={imageUrl} />{" "}
            </label>
            <label>
              Country:
              <input type="text" name="country" defaultValue={country} />
            </label>
            <label>
              Content:
              <textarea name="content" id="content" defaultValue={content} />
            </label>
            <label>
              Rating:
              <input type="text" name="rating" defaultValue={rating} />
            </label>

            <Button
              type="submit"
              onClick={() => toast.success("Update successful")}
            >
              Save changes
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
