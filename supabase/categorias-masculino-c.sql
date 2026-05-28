-- Migración: agregar categorías 2019C–2022C - Masculino
-- Fecha: 2026-05-28
--
-- Estas 4 categorías tenían jugadores asignados (23 en total) pero no existían
-- en la tabla categorias, por lo que no aparecían en ningún filtro del dashboard.
--
-- Se insertan después de 2018C (orden 16), corriendo los órdenes existentes +4.

UPDATE categorias
SET orden = orden + 4
WHERE club_id = 'c0e39a62-3308-47eb-bc75-a8a61500ced0'
  AND orden >= 17;

INSERT INTO categorias (club_id, nombre, activo, orden)
VALUES
  ('c0e39a62-3308-47eb-bc75-a8a61500ced0', '2019C - Masculino', true, 17),
  ('c0e39a62-3308-47eb-bc75-a8a61500ced0', '2020C - Masculino', true, 18),
  ('c0e39a62-3308-47eb-bc75-a8a61500ced0', '2021C - Masculino', true, 19),
  ('c0e39a62-3308-47eb-bc75-a8a61500ced0', '2022C - Masculino', true, 20);
