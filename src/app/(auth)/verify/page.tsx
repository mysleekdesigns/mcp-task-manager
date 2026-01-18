import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VerifyPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Check your email</CardTitle>
        <CardDescription>
          We&apos;ve sent you a verification link to your email address
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          Click the link in your email to verify your account and complete
          registration. The link will expire in 24 hours.
        </p>
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive an email? Check your spam folder or request a new
          verification link.
        </p>
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <Button variant="outline" className="w-full" asChild>
          <Link href="/login">Back to login</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
