ALTER TABLE users
ADD COLUMN service_shop_id UUID;

ALTER TABLE users
ADD CONSTRAINT fk_user_service_shop
FOREIGN KEY (service_shop_id) REFERENCES service_shops(id) ON DELETE SET NULL;
