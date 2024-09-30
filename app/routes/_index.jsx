import "../styles/Home.css";
import { useState } from "react";
import { Button, ButtonGroup } from "@nextui-org/react";
import { Link } from "@nextui-org/react";
import { Form } from "@remix-run/react";
import { useFetcher } from "@remix-run/react";
// import { action as LoginSite } from "./auth.auth0";
export const meta = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  const fetcher = useFetcher();
  const fetcher2 = useFetcher();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const handleAuth0Login = () => {
    fetcher.submit(null, { method: "post", action: "/auth/auth0" });
  };
  const logout = () => {
    fetcher2.submit(null, { method: "post", action: "/auth/logout" });
  };

  const toggleDropdown = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  return (
    <>
      <header>
        <nav>
          <ul>
            <li>
              <div>
                <span>logo</span>
              </div>
            </li>
            <li>
              <div className="flex gap-2">
                <Link href="#" color="foreground">
                  Foreground
                </Link>
                <Link href="#" color="foreground">
                  Foreground
                </Link>
                <Link href="#" color="foreground">
                  Foreground
                </Link>
              </div>
            </li>
            <li>
              <Button onClick={handleAuth0Login} color="primary" variant="flat">
                Sign In
              </Button>
            </li>
            <li>
              <Button onClick={logout} color="primary" variant="flat">
                Sign Out
              </Button>
            </li>
          </ul>
        </nav>
      </header>
    </>
  );
}
