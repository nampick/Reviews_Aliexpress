import { authenticator } from "../server/auth.server.js";
import { useLoaderData } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
import { useState } from "react";
import "../styles/Home.css";
import {
  Button,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
  Input,
  Skeleton,
} from "@nextui-org/react";
import { Tabs, Tab, Card, CardBody, Switch } from "@nextui-org/react";
import { Toaster, toast } from "sonner";
import Product_table from "./Product_table_vs2.jsx";
import Review_table from "./review_table.jsx";

import Setting from "./setting.jsx";
import { useFetcher } from "@remix-run/react";
//ss
import { getSession, commitSession } from "../server/session.server";
import { action as deleteProductAction } from "./deleteproduct.jsx";
import { action as deleteReviewAction } from "./delete_review.jsx";
import { action as downloandReviews } from "./downloand_reviews.jsx";
import { useSearchParams } from "@remix-run/react";
//ss
const prisma = new PrismaClient();

export async function loader({ request }) {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return json({ error: "User not authenticated" }, { status: 401 });
  }

  // Kiểm tra xem người dùng đã có trong database hay chưa
  let existingUser = await prisma.user.findUnique({
    where: { email: user._json.email },
  });

  // Nếu người dùng chưa tồn tại, tạo mới trong database
  if (!existingUser) {
    existingUser = await prisma.user.create({
      data: {
        email: user._json.email,
        userName: user._json.name,
        picture: user._json.picture,
        isEmailVerified: user._json.email_verified,
      },
    });
  }

  // Lấy session từ người dùng
  const session = await getSession(request.headers.get("Cookie"));

  // Nếu userId chưa có trong session, thiết lập userId vào session
  if (!session.get("userId")) {
    session.set("userId", existingUser.id); // Gán userId từ database vào session
  }

  // Lưu lại session mới với userId bằng commitSession
  const cookieHeader = await commitSession(session); // Sử dụng commitSession

  // Tìm các sản phẩm liên kết với userId
  const products = await prisma.product.findMany({
    where: { userId: existingUser.id },
    include: {
      reviews: true, // Bao gồm các review để tính số lượng
    }, // Dùng userId từ database
  });

  // Nếu chưa có sản phẩm, chuyển hướng đến trang tạo sản phẩm
  if (products.length === 0) {
    return redirect("/Insert_product", {
      headers: { "Set-Cookie": cookieHeader },
    });
  }
  // Tính số lượng reviews cho mỗi sản phẩm
  const productsWithReviewCount = products.map((product) => ({
    ...product,
    reviewCount: product.reviews.length, // Đếm số lượng review
  }));

  // Trả về dữ liệu cùng với session mới
  return json(
    { user, products: productsWithReviewCount },
    { headers: { "Set-Cookie": cookieHeader } }
  );
}
export async function action({ request }) {
  const formData = await request.formData();
  const actionType = formData.get("_actionType");
  console.log("action type:" + actionType);

  if (actionType === "Delete_product") {
    return await deleteProductAction({ formData }); // Chuyển formData vào
  } else if (actionType === "Delete_review") {
    return await deleteReviewAction({ formData }); // Chuyển formData vào
  } else if (actionType === "download") {
    return await downloandReviews({ formData }); // Chuyển formData vào
  }
}
export default function Home() {
  const { user, products } = useLoaderData();
  const [isVertical, setIsVertical] = useState(true);
  const [searchParams] = useSearchParams();

  if (!user) {
    return <p>Loading...</p>; // Hoặc thông báo lỗi nếu không có người dùng
  }
  const initialTab = searchParams.get("tab") || "Products"; // "Products" là tab mặc định
  // "photos" là tab mặc định
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!user) {
    return <p>Loading...</p>; // Hoặc thông báo lỗi nếu không có người dùng
  }

  // Hàm thay đổi tab
  const handleTabChange = (key) => {
    setActiveTab(key);
    // Cập nhật URL mà không làm mới trang và không thêm tham số tab
    const url = new URL(window.location);
    url.searchParams.delete("tab"); // Xóa tham số tab

    // Cập nhật URL mà không làm mới trang
    window.history.replaceState({}, document.title, url);
  };
  const fetcher = useFetcher();
  const logout = () => {
    fetcher.submit(null, { method: "post", action: "/auth/logout" });
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <header>
        <Navbar className="custom-navbar">
          <NavbarBrand>
            <img src="./logo.png" alt="logo" height={"70px"} width={"70px"} />
          </NavbarBrand>

          <NavbarContent className="hidden sm:flex gap-4" justify="center">
            <NavbarItem>
              <Link color="foreground" href="#">
                {/* Features */}
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link color="foreground" href="#" aria-current="page">
                {/* Customers */}
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link color="foreground" href="#">
                {/* Integrations */}
              </Link>
            </NavbarItem>
          </NavbarContent>

          <NavbarContent as="div" justify="end">
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform"
                  color="success"
                  name={user._json.name}
                  size="sm"
                  src={user._json.picture}
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="Profile Actions" variant="flat">
                <DropdownItem key="profile" className="h-14 gap-2">
                  <p className="font-semibold">{user._json.name}</p>
                  <p className="font-semibold">{user._json.email}</p>
                </DropdownItem>
                <DropdownItem key="help_and_feedback">
                  Help & Feedback
                </DropdownItem>
                <DropdownItem key="logout" color="danger">
                  <Button onClick={logout}> Sign Out </Button>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarContent>
        </Navbar>
      </header>
      <div className="flex flex-col px-4 card_pruducts">
        <Switch
          className="mb-4"
          isSelected={isVertical}
          onValueChange={setIsVertical}
          size={"sm"}
          color={"success"}
        >
          Vertical
        </Switch>
        <div className="flex w-full flex-col">
          <Tabs
            aria-label="Options"
            size="lg"
            color={"success"}
            variant="bordered"
            isVertical={isVertical}
            selectedKey={activeTab} // Thay đổi tab dựa trên giá trị activeTab
            onSelectionChange={handleTabChange} // Xử lý thay đổi tab
          >
            <Tab key="Products" title="Products">
              <Card>
                <CardBody className="custom-card-body">
                  <div className="product">
                    <Product_table products={products} />
                  </div>
                </CardBody>
              </Card>
            </Tab>
            <Tab key="Reviews" title="Reviews">
              <Card>
                <CardBody className="custom-card-body">
                  <Review_table products={products} />
                </CardBody>
              </Card>
            </Tab>
            <Tab key="Setting" title="Setting">
              <Card>
                <CardBody className="custom-card-body">
                  <Setting />
                </CardBody>
              </Card>
            </Tab>
          </Tabs>
        </div>
      </div>
      <section class="bg-white">
        <div class="max-w-screen-xl px-4 py-12 mx-auto space-y-8 overflow-hidden sm:px-6 lg:px-8">
          <nav class="flex flex-wrap justify-center -mx-5 -my-2">
            <div class="px-5 py-2">
              <a
                href="#"
                class="text-base leading-6 text-gray-500 hover:text-gray-900"
              >
                About
              </a>
            </div>
            <div class="px-5 py-2">
              <a
                href="#"
                class="text-base leading-6 text-gray-500 hover:text-gray-900"
              >
                Blog
              </a>
            </div>
            <div class="px-5 py-2">
              <a
                href="#"
                class="text-base leading-6 text-gray-500 hover:text-gray-900"
              >
                Team
              </a>
            </div>
            <div class="px-5 py-2">
              <a
                href="#"
                class="text-base leading-6 text-gray-500 hover:text-gray-900"
              >
                Pricing
              </a>
            </div>
            <div class="px-5 py-2">
              <a
                href="#"
                class="text-base leading-6 text-gray-500 hover:text-gray-900"
              >
                Contact
              </a>
            </div>
            <div class="px-5 py-2">
              <a
                href="#"
                class="text-base leading-6 text-gray-500 hover:text-gray-900"
              >
                Terms
              </a>
            </div>
          </nav>
          <div class="flex justify-center mt-8 space-x-6">
            <a href="#" class="text-gray-400 hover:text-gray-500">
              <span class="sr-only">Facebook</span>
              <svg
                class="w-6 h-6"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fill-rule="evenodd"
                  d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </a>
            <a href="#" class="text-gray-400 hover:text-gray-500">
              <span class="sr-only">Instagram</span>
              <svg
                class="w-6 h-6"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fill-rule="evenodd"
                  d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </a>
            <a href="#" class="text-gray-400 hover:text-gray-500">
              <span class="sr-only">Twitter</span>
              <svg
                class="w-6 h-6"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
              </svg>
            </a>
            <a href="#" class="text-gray-400 hover:text-gray-500">
              <span class="sr-only">GitHub</span>
              <svg
                class="w-6 h-6"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fill-rule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </a>
            <a href="#" class="text-gray-400 hover:text-gray-500">
              <span class="sr-only">Dribbble</span>
              <svg
                class="w-6 h-6"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fill-rule="evenodd"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </a>
          </div>
          <p class="mt-8 text-base leading-6 text-center text-gray-400">
            © 2023 Import Review Aliexpress.
          </p>
        </div>
      </section>
    </>
  );
}
