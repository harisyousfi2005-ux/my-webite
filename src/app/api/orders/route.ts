import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { PRODUCTS } from "@/lib/data";

const ORDERS_PATH = join(process.cwd(), "data", "orders.json");

interface CartItemPayload {
  productId: string;
  quantity: number;
}

type PaymentMethod = "cash" | "card";

interface OrderPayload {
  name: string;
  phone: string;
  address: string;
  paymentMethod: PaymentMethod;
  items: CartItemPayload[];
}

export async function POST(request: Request) {
  const body: Partial<OrderPayload> = await request.json();
  const { name, phone, address, paymentMethod, items } = body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof phone !== "string" ||
    !phone.trim() ||
    typeof address !== "string" ||
    !address.trim() ||
    (paymentMethod !== "cash" && paymentMethod !== "card") ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return NextResponse.json(
      { error: "Missing or invalid fields" },
      { status: 400 },
    );
  }

  const resolvedItems = [];
  for (const item of items) {
    if (
      typeof item.productId !== "string" ||
      typeof item.quantity !== "number" ||
      item.quantity < 1
    ) {
      return NextResponse.json({ error: "Invalid cart item" }, { status: 400 });
    }
    const product = PRODUCTS.find((p) => p.id === item.productId);
    if (!product) {
      return NextResponse.json(
        { error: `Unknown product: ${item.productId}` },
        { status: 404 },
      );
    }
    resolvedItems.push({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: item.quantity,
    });
  }

  const total = resolvedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const order = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    name: name.trim(),
    phone: phone.trim(),
    address: address.trim(),
    paymentMethod,
    items: resolvedItems,
    total,
  };

  await mkdir(dirname(ORDERS_PATH), { recursive: true });
  let existing: unknown[] = [];
  try {
    existing = JSON.parse(await readFile(ORDERS_PATH, "utf-8"));
  } catch {
    existing = [];
  }
  existing.push(order);
  await writeFile(ORDERS_PATH, JSON.stringify(existing, null, 2));

  return NextResponse.json({ ok: true, orderId: order.id });
}
