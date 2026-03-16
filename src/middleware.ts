import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Rol } from "@/types/database";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Parameters<typeof response.cookies.set>[2];
          }[]
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isSuperadminPanel = request.nextUrl.pathname.startsWith("/superadmin");
  const isProtected = isDashboard || isSuperadminPanel;

  if (!user && isProtected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isProtected) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("rol, activo, club_id")
      .eq("id", user.id)
      .single();

    const rol = profile?.rol as Rol | undefined;
    const activo = profile?.activo ?? false;
    const clubId = profile?.club_id;

    if (!activo) {
      await supabase.auth.signOut();
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("inactivo", "1");
      return NextResponse.redirect(loginUrl);
    }

    if (rol !== "superadmin" && clubId && isDashboard) {
      const { data: club } = await supabase
        .from("clubs")
        .select("activo")
        .eq("id", clubId)
        .single();
      if (club && !club.activo) {
        await supabase.auth.signOut();
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("suspended", "1");
        return NextResponse.redirect(loginUrl);
      }
    }

    if (rol === "superadmin" && isDashboard) {
      return NextResponse.redirect(new URL("/superadmin", request.url));
    }

    if (rol !== "superadmin" && isSuperadminPanel) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/superadmin/:path*",
  ],
};
