// app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from "next-auth/jwt";
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import { authMiddleware, authorizeRoles } from '../../../../middleware/authMiddleware';

const SECRET_KEY = process.env.JWT_SECRET;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;


async function applyMiddleware(request: NextRequest) {
  const authResponse = await authMiddleware(request);
  if (authResponse) return authResponse;
  const roleResponse = await authorizeRoles(['ADMIN'])(request);
  if (roleResponse) return roleResponse;
  return null;
}

export async function GET(request: NextRequest) {
  const middlewareResponse = await applyMiddleware(request);
  if (middlewareResponse) return middlewareResponse;

  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("📩 Body recibido:", body);

    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      console.warn("⚠️ Faltan campos obligatorios");
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    console.log("🔎 Verificando usuarios existentes...");
    const userCount = await prisma.user.count();
    console.log("👥 Cantidad de usuarios:", userCount);

    // ✅ Crear primer usuario si la base está vacía
    if (userCount === 0) {
      console.log("🛠️ Creando primer usuario ADMIN...");
      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "ADMIN",
        },
        select: { id: true, name: true, email: true, role: true },
      });
      console.log("✅ ADMIN creado correctamente:", admin);

      return NextResponse.json({
        message: "✅ Primer usuario (ADMIN) creado correctamente",
        user: admin,
      });
    }

    // 🔒 Si hay usuarios, validar autenticación
    const nextAuthToken = await getToken({ req: request, secret: NEXTAUTH_SECRET });
    const authHeader = request.headers.get("Authorization");
    const manualToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    let userRole: string | null = null;

    if (nextAuthToken) {
      userRole = (nextAuthToken as any).role;
    } else if (manualToken && SECRET_KEY) {
      const decoded: any = jwt.verify(manualToken, SECRET_KEY);
      userRole = decoded.role;
    } else {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // 🚫 Validar duplicado
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "El correo ya está en uso" }, { status: 400 });
    }

    // Crear usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "SELLER",
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({
      message: "Usuario creado correctamente",
      user: newUser,
    });
  } catch (error: any) {
    console.error("❌ Error al crear usuario:", error);
    return NextResponse.json(
      { error: "Error interno al crear usuario", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const middlewareResponse = await applyMiddleware(request);
  if (middlewareResponse) return middlewareResponse;

  try {
    const { id, name, email, password, role } = await request.json();
    const updateData: any = { name, email, role };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: String(id) },
      data: updateData,
      select: { id: true, name: true, email: true, role: true }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Error updating user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const middlewareResponse = await applyMiddleware(request);
  if (middlewareResponse) return middlewareResponse;

  try {
    const { id } = await request.json();
    await prisma.user.delete({
      where: { id: String(id) },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Error deleting user' }, { status: 500 });
  }
}