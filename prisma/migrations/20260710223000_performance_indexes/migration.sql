CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Product_name_trgm_idx" ON "Product" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Product_description_trgm_idx" ON "Product" USING GIN ("description" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Brand_name_trgm_idx" ON "Brand" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "ProductVariant_sku_trgm_idx" ON "ProductVariant" USING GIN ("sku" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Product_active_created_idx" ON "Product" ("isActive", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Product_active_price_idx" ON "Product" ("isActive", "basePrice");
CREATE INDEX IF NOT EXISTS "Category_active_parent_idx" ON "Category" ("isActive", "parentId", "name");
CREATE INDEX IF NOT EXISTS "ProductVariant_product_active_idx" ON "ProductVariant" ("productId", "isActive");
CREATE INDEX IF NOT EXISTS "PaymentAttempt_order_provider_created_idx" ON "PaymentAttempt" ("orderId", "provider", "createdAt" DESC);
