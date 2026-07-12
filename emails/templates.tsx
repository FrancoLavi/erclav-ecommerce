import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type EmailLayoutProps = {
  preview: string;
  children: React.ReactNode;
};

type OrderLine = {
  name: string;
  quantity: number;
  unitPrice: string;
  total: string;
};

const main = {
  backgroundColor: "#f6f6f3",
  color: "#111111",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const container = {
  width: "100%",
  maxWidth: "620px",
  margin: "0 auto",
  padding: "32px 20px",
};

const card = {
  backgroundColor: "#ffffff",
  border: "1px solid #e7e5e4",
  borderRadius: "14px",
  padding: "28px",
};

const eyebrow = {
  color: "#737373",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0",
  textTransform: "uppercase" as const,
};

const title = {
  color: "#111111",
  fontSize: "28px",
  fontWeight: "800",
  lineHeight: "34px",
  margin: "10px 0 16px",
};

const paragraph = {
  color: "#525252",
  fontSize: "15px",
  lineHeight: "24px",
};

const button = {
  backgroundColor: "#111111",
  borderRadius: "999px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "700",
  padding: "14px 22px",
  textDecoration: "none",
};

function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={{ fontSize: "20px", fontWeight: "900", margin: "0 0 18px" }}>ErcLav</Text>
          <Section style={card}>{children}</Section>
          <Text style={{ ...paragraph, fontSize: "12px", textAlign: "center" as const }}>
            ErcLav - Ecommerce premium. Este email fue enviado automaticamente.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function VerificationEmail({ name, verifyUrl }: { name: string; verifyUrl: string }) {
  return (
    <EmailLayout preview="Verifica tu cuenta ErcLav">
      <Text style={eyebrow}>Verificacion</Text>
      <Heading style={title}>Confirma tu email</Heading>
      <Text style={paragraph}>Hola {name}, confirma tu email para activar tu cuenta y empezar a comprar.</Text>
      <Button href={verifyUrl} style={button}>Verificar cuenta</Button>
    </EmailLayout>
  );
}

export function WelcomeEmail({ name, storeUrl }: { name: string; storeUrl: string }) {
  return (
    <EmailLayout preview="Bienvenido a ErcLav">
      <Text style={eyebrow}>Bienvenida</Text>
      <Heading style={title}>Tu cuenta ya esta lista</Heading>
      <Text style={paragraph}>Hola {name}, gracias por sumarte a ErcLav. Ya podes guardar favoritos, comprar y seguir tus ordenes.</Text>
      <Button href={storeUrl} style={button}>Ir a la tienda</Button>
    </EmailLayout>
  );
}

export function PasswordResetEmail({ name, resetUrl }: { name: string; resetUrl: string }) {
  return (
    <EmailLayout preview="Restablece tu contrasena">
      <Text style={eyebrow}>Seguridad</Text>
      <Heading style={title}>Restablece tu contrasena</Heading>
      <Text style={paragraph}>Hola {name}, recibimos una solicitud para cambiar tu contrasena. El enlace vence pronto.</Text>
      <Button href={resetUrl} style={button}>Crear nueva contrasena</Button>
    </EmailLayout>
  );
}

export function OrderConfirmationEmail({
  name,
  orderNumber,
  total,
  orderUrl,
}: {
  name: string;
  orderNumber: string;
  total: string;
  orderUrl: string;
}) {
  return (
    <EmailLayout preview={`Confirmamos tu orden ${orderNumber}`}>
      <Text style={eyebrow}>Compra recibida</Text>
      <Heading style={title}>Gracias por tu compra</Heading>
      <Text style={paragraph}>Hola {name}, recibimos la orden {orderNumber}. Total: {total}.</Text>
      <Button href={orderUrl} style={button}>Ver orden</Button>
    </EmailLayout>
  );
}

export function OrderStatusEmail({
  name,
  orderNumber,
  status,
  orderUrl,
}: {
  name: string;
  orderNumber: string;
  status: string;
  orderUrl: string;
}) {
  return (
    <EmailLayout preview={`Tu orden ${orderNumber} cambio de estado`}>
      <Text style={eyebrow}>Actualizacion</Text>
      <Heading style={title}>Tu pedido ahora esta en estado {status}</Heading>
      <Text style={paragraph}>Hola {name}, actualizamos el estado de tu orden {orderNumber}.</Text>
      <Button href={orderUrl} style={button}>Ver detalle</Button>
    </EmailLayout>
  );
}

export function InvoiceEmail({
  name,
  orderNumber,
  total,
  lines,
}: {
  name: string;
  orderNumber: string;
  total: string;
  lines: OrderLine[];
}) {
  return (
    <EmailLayout preview={`Factura de la orden ${orderNumber}`}>
      <Text style={eyebrow}>Factura</Text>
      <Heading style={title}>Comprobante de compra</Heading>
      <Text style={paragraph}>Hola {name}, este es el resumen facturado de tu orden {orderNumber}.</Text>
      <Hr />
      {lines.map((line) => (
        <Section key={`${line.name}-${line.quantity}`} style={{ margin: "12px 0" }}>
          <Text style={{ ...paragraph, margin: 0, color: "#111111", fontWeight: "700" }}>{line.name}</Text>
          <Text style={{ ...paragraph, margin: "4px 0 0" }}>
            {line.quantity} x {line.unitPrice} - {line.total}
          </Text>
        </Section>
      ))}
      <Hr />
      <Text style={{ ...paragraph, color: "#111111", fontWeight: "800" }}>Total facturado: {total}</Text>
    </EmailLayout>
  );
}

export function OrderCancelledEmail({
  name,
  orderNumber,
  reason,
}: {
  name: string;
  orderNumber: string;
  reason?: string;
}) {
  return (
    <EmailLayout preview={`Orden ${orderNumber} cancelada`}>
      <Text style={eyebrow}>Cancelacion</Text>
      <Heading style={title}>Tu compra fue cancelada</Heading>
      <Text style={paragraph}>Hola {name}, la orden {orderNumber} fue cancelada.</Text>
      {reason ? <Text style={paragraph}>Motivo: {reason}</Text> : null}
    </EmailLayout>
  );
}
