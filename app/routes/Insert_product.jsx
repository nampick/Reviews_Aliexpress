import React from "react";
import { Button, Link } from "@nextui-org/react";
import { useLoaderData, Form } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { prisma } from "../server/db.server";
import { getSession } from "../server/session.server";
import "../styles/insert_product.css";
import UploadWidget from "../layouts/uploadimage";
import { useState } from "react";
import { Toaster, toast } from "sonner";
// Hành động thêm mới sản phẩm
export const action = async ({ request }) => {
  const formData = await request.formData();
  const name = formData.get("name");
  const description = formData.get("description");
  const url = formData.get("url");

  // Lấy session từ phiên người dùng
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  if (!userId) {
    return json({ error: "Người dùng chưa đăng nhập" }, { status: 401 });
  }

  if (!name) {
    return json({ error: "Lỗi nhập dữ liệu" }, { status: 400 });
  }

  // Tạo sản phẩm mới và liên kết với userId
  await prisma.product.create({
    data: {
      name,
      description,
      url,
      userId, // Gắn sản phẩm với userId
    },
  });

  return redirect("/Home");
};
export default function ProductTable() {
  const [imageUrl, setImageUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // Thêm trạng thái để lưu lỗi

  function handleUpload(url, error) {
    if (error) {
      setErrorMessage("Upload failed: " + error.message); // Hiển thị thông báo lỗi
      setImageUrl(""); // Reset URL nếu có lỗi
    } else {
      setImageUrl(url); // Lưu URL của ảnh
      setErrorMessage(""); // Reset thông báo lỗi
    }
  }
  function handleInputChange(event) {
    setImageUrl(event.target.value);
  }
  return (
    <>
      <div className="modal-overlay">
        <div className="form-container">
          <h3>Add New Product</h3>
          <Form method="post">
            <div>
              <label>Product Name:</label>
              <input type="text" name="name" required />
            </div>
            <div>
              <label>Description:</label>
              <input type="text" name="description" required />
            </div>
            <div>
              <label>Image URL:</label>
              <UploadWidget onUpload={handleUpload} />
              {errorMessage && (
                <p style={{ color: "red" }}>{errorMessage}</p>
              )}{" "}
              {/* Hiển thị lỗi nếu có */}
              {imageUrl && (
                <div>
                  <h2>Uploaded Image:</h2>
                  <img
                    src={imageUrl}
                    alt="Uploaded"
                    height={"20px"}
                    width={"20px"}
                  />
                </div>
              )}
              <input
                type="text"
                name="url"
                id="url"
                value={imageUrl}
                onChange={handleInputChange}
                required
              />
            </div>

            <Button
              type="submit"
              onClick={() => toast.success("Add product successfully")}
              size="sm"
              radius="sm"
              variant="flat"
            >
              Add Product
            </Button>
            <Button
              size="sm"
              color="danger"
              radius="sm"
              variant="bordered"
              as={Link}
              href="./Home"
            >
              Close
            </Button>
          </Form>
        </div>
      </div>
    </>
  );
}
