# Hlasování + žaloby

Web obsahuje:
- přihlášení pomocí uživatelského jména,
- ankety,
- vytváření anket pouze pro Mikuláše Musialeka, Miroslava Štropa a Vojtěcha Laichmana,
- hlasování,
- podávání žalob libovolným přihlášeným uživatelem,
- přehled podaných žalob,
- rozkliknutí žaloby pro zobrazení celého textu.

## Důležité
Tato verze je stále statická a ukládá data do `localStorage`. To znamená, že různí návštěvníci webu nesdílejí stejná data.

Pro skutečný veřejný web, kde se ankety a žaloby okamžitě zobrazí všem uživatelům, je potřeba online databáze/backend.


Žalobu může poslat každý. Aktivní žalobu vidí pouze odesílatel a Miroslav Štrop. Miroslav Štrop ji může přijmout nebo zamítnout; v obou případech zmizí z aktivního seznamu.
