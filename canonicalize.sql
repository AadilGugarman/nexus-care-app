-- canonicalize.sql
-- SQL helper: canonicalize_location(text) returns canonical location string

CREATE OR REPLACE FUNCTION canonicalize_location(txt text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF txt IS NULL THEN
    RETURN NULL;
  END IF;
  CASE
    WHEN lower(trim(txt)) LIKE '%kheda%' THEN
      RETURN 'Kheda-Matar';
    WHEN lower(trim(txt)) LIKE '%kathlal%' OR lower(trim(txt)) LIKE '%kapadvanj%' THEN
      RETURN 'Kathlal-Kapadvanj';
    WHEN lower(trim(txt)) LIKE '%salun%' OR lower(trim(txt)) LIKE '%dakor%' OR lower(trim(txt)) LIKE '%umreth%' THEN
      RETURN 'Salun-Dakor-Umreth';
    WHEN lower(trim(txt)) = 'anand' THEN
      RETURN 'Anand';
    WHEN lower(trim(txt)) = 'nadiad' THEN
      RETURN 'Nadiad';
    ELSE
      RETURN initcap(lower(trim(txt)));
  END CASE;
END;
$$;
