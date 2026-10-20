import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SASPAY_API_URL = (
  process.env.SASPAY_API_URL || "https://api.saspay.me/api/v1"
).replace(/\/+$/, "");

type JsonRecord = Record<string, unknown>;

function asObject(value: unknown): JsonRecord | null {
  if (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as JsonRecord;
  }

  return null;
}

function getString(
  object: JsonRecord,
  keys: string[]
): string {
  for (const key of keys) {
    const value = object[key];

    if (typeof value === "string" || typeof value === "number") {
      const result = String(value).trim();

      if (result) return result;
    }
  }

  return "";
}

function getItems(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) {
    return value
      .map(asObject)
      .filter((item): item is JsonRecord => item !== null);
  }

  const object = asObject(value);

  if (!object) return [];

  for (const key of [
    "results",
    "data",
    "networks",
    "countries",
    "items",
    "records",
  ]) {
    const nested = object[key];

    if (Array.isArray(nested)) {
      return getItems(nested);
    }

    const nestedObject = asObject(nested);

    if (nestedObject) {
      const items = getItems(nestedObject);

      if (items.length > 0) return items;
    }
  }

  return [];
}

async function fetchJson(
  endpoint: string,
  secretKey: string,
  authenticated = true
): Promise<unknown> {
  const response = await fetch(
    `${SASPAY_API_URL}${endpoint}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(authenticated
          ? { Authorization: `Bearer ${secretKey}` }
          : {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!response.ok) {
    throw new Error(`SASPAY_HTTP_${response.status}`);
  }

  return response.json();
}

export async function GET() {
  try {
    const secretKey = process.env.SASPAY_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        {
          success: false,
          message: "La clé secrète SasPay n'est pas configurée.",
        },
        { status: 503 }
      );
    }

    // Récupération des réseaux et des pays.
    const [networkPayload, countryPayload] = await Promise.all([
      fetchJson(
        "/networks/?page=1&page_size=100",
        secretKey
      ),
      fetchJson("/countries/", secretKey, false),
    ]);

    const networks = getItems(networkPayload);
    const countries = getItems(countryPayload);

    // Recherche du Togo dans la liste des pays.
    const togo = countries.find((country) => {
      const code = getString(country, [
        "code",
        "country_code",
        "countryCode",
        "iso2",
        "iso",
        "alpha2",
      ]).toUpperCase();

      const name = getString(country, [
        "name",
        "country_name",
        "countryName",
      ]).toLowerCase();

      return (
        code === "TG" ||
        code === "TGO" ||
        name === "togo"
      );
    });

    if (!togo) {
      console.error(
        "SasPay : pays Togo introuvable.",
        countries.map((country) => ({
          id: getString(country, ["id"]),
          code: getString(country, [
            "code",
            "country_code",
            "iso2",
          ]),
          name: getString(country, ["name", "country_name"]),
        }))
      );

      return NextResponse.json({
        success: true,
        networks: [],
        message:
          "Le Togo n'a pas été identifié dans la liste des pays SasPay.",
      });
    }

    const togoId = getString(togo, ["id", "country_id", "countryId"]);

    // Le champ network.country peut être directement l'identifiant
    // du pays, comme dans l'exemple de la documentation SasPay.
    const result = networks
      .filter((network) => {
        const active = network.is_active;

        if (active === false || active === 0) {
          return false;
        }

        const status = getString(network, ["status"]).toLowerCase();

        if (["inactive", "disabled", "archived"].includes(status)) {
          return false;
        }

        const countryId = getString(network, [
          "country",
          "country_id",
          "countryId",
        ]);

        return countryId === togoId;
      })
      .map((network) => ({
        id: getString(network, ["id"]),
        code: getString(network, [
          "code",
          "network_code",
          "networkCode",
        ]),
        name: getString(network, [
          "name",
          "network_name",
          "networkName",
        ]),
      }))
      .filter((network) => network.id && network.code && network.name);

    return NextResponse.json(
      {
        success: true,
        networks: result,
        ...(result.length === 0
          ? {
              message:
                "Aucun réseau actif associé au Togo dans la réponse SasPay.",
            }
          : {}),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Erreur SasPay :", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Impossible de récupérer les réseaux de paiement SasPay.",
      },
      { status: 502 }
    );
  }
}