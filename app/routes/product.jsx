import { json, redirect } from "@remix-run/node";
import {
  useLoaderData,
  Form,
  useActionData,
  useNavigation,
} from "@remix-run/react";
import { prisma } from "../server/db.server";
import { getSession } from "../server/session.server";

export const loader = async ({ request }) => {
  // Lấy session từ người dùng
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  if (!userId) {
    return redirect("/login"); // Chuyển hướng về trang đăng nhập nếu người dùng chưa đăng nhập
  }

  // Tìm các sản phẩm liên kết với userId
  const products = await prisma.product.findMany({
    where: { userId },
  });

  if (products.length === 0) {
    return redirect("/create-product"); // Chuyển hướng về trang tạo sản phẩm nếu chưa có sản phẩm
  }

  return json({ products }); // Trả về danh sách sản phẩm của người dùng
};
// thêm mới sản phẩm
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

export default function ProductList() {
  const { products } = useLoaderData(); // Lấy dữ liệu sản phẩm từ loader
  const actionData = useActionData(); // Dữ liệu phản hồi từ action
  const transition = useNavigation(); // Hiển thị trạng thái submit

  return (
    <div>
      <h1 className="text-2xl font-bold">Product List</h1>

      {/* Nút thêm sản phẩm mới */}
      <details className="mb-4">
        <summary className="cursor-pointer text-blue-500">
          + Add New Product
        </summary>
        {/* Form thêm sản phẩm */}
        <Form method="post" className="mt-4 space-y-4">
          {actionData?.error && (
            <p className="text-red-500">{actionData.error}</p>
          )}
          <div>
            <label htmlFor="name" className="block">
              Product Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              className="border rounded px-2 py-1"
            />
          </div>
          <div>
            <label htmlFor="description" className="block">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              className="border rounded px-2 py-1"
            />
          </div>
          <div>
            <label htmlFor="url" className="block">
              Product Image URL
            </label>
            <input
              type="text"
              name="url"
              id="url"
              className="border rounded px-2 py-1"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            {transition.state === "submitting" ? "Adding..." : "Add Product"}
          </button>
        </Form>
      </details>

      {/* Danh sách sản phẩm */}
      <ul className="space-y-4">
        {products.map((product) => (
          <li key={product.id} className="border p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p>{product.description || "No description available"}</p>
            {product.url && (
              <img
                src={product.url}
                alt={product.name}
                width="200"
                className="mt-2"
              />
            )}
            <p className="text-gray-500">
              Created at: {new Date(product.createdAt).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
