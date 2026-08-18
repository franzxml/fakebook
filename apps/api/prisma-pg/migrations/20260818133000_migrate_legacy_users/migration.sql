DO $$
BEGIN
  IF to_regclass('public."User"') IS NOT NULL THEN
    INSERT INTO "users" (
      "id",
      "name",
      "email",
      "created_at",
      "updated_at"
    )
    SELECT
      'legacy-' || "id"::TEXT,
      "name",
      "email",
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM "User"
    ON CONFLICT ("email") DO NOTHING;

    DROP TABLE "User";
  END IF;
END
$$;
