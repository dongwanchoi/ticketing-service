import type { Metadata } from "next";
import AuthForm from "@/features/auth/components/AuthForm";

export const metadata: Metadata = { title: "로그인 | MOMENT" };
export default function LoginPage() { return <AuthForm mode="login" />; }
