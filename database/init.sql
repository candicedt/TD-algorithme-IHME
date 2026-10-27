CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS machines (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS reservations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    machine_id BIGINT NOT NULL REFERENCES machines(id),
    reserved_by TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    CHECK (end_time > start_time),
    EXCLUDE USING gist (
        machine_id WITH =,
        tstzrange(start_time, end_time, '[)') WITH &&
    )
);

INSERT INTO machines (name, description)
VALUES
    ('Machine de traction', 'Essais de traction'),
    ('Banc de flexion', 'Essais de flexion'),
    ('Machine d’impact', 'Essais d’impact')
ON CONFLICT (name) DO NOTHING;