INSERT OR IGNORE INTO question_images (question_id, filename, storage_url) VALUES (30, 'schema_brise_thermique.png', 'meteo/phenomenes_locaux/30/images/schema_brise_thermique.png');
UPDATE questions SET question_md = 'Un schéma est attendu', correction_md = 'La brise thermique s''établit le long des côtes par beau temps. Elle est initiée et alimentée par une différence de températures entre l’air marin et l’air situé au-dessus de la terre. Par beau temps, la terre chauffe bien plus rapidement que l’eau qui reste à une température constante. L’air terrestre est alors lui-même réchauffé et s’élève en altitude. On assiste à la création d’une cellule convective locale. L’air chaud est remplacé par l’air venu de la mer. Lorsque l’air chaud en altitude se refroidit et est pour partie déporté vers le large, des cumulus se créent et sont un signe annonciateur de thermique. Au niveau de la mer (altitude 0), la brise thermique se concrétise par un vent venu du large. 

Eléments favorables à l’établissement de la brise thermique :

- Forte différence entre la température de l’eau et de l’air.
- Du beau temps sur la côte.
- Un vent synoptique terrestre compris entre 10 et 16 nœuds (il aide à chasser l’air chaud vers la mer et donc à enclencher la cellule convective).
- Une côte qui chauffe vite et fort par la présence d’un sol sombre (parking en Méditerranée par exemple). A l’inverse, des côtes bordées de forêts sont moins propices.
- Un système météo instable. Des conditions d’instabilité permettent à l’air chaud de monter en altitude. Au contraire, dans le cas d’un fort anticyclone, les courants d’air ascendants peuvent être bloqués.

![image_correction](images/schema_brise_thermique.png)' WHERE id = 30;
INSERT OR IGNORE INTO question_images (question_id, filename, storage_url) VALUES (33, 'grain.png', 'meteo/phenomenes_locaux/33/images/grain.png');
UPDATE questions SET question_md = '*En force et en direction*

![image](images/grain.png)', correction_md = 'Le vent se renforce à l''approche du grain (le vent généré par le grain s''ajoute au vent synoptique), est maximal en dessous, puis baisse lorsque le grain est passé (vent synoptique opposé au vent généré localement par le grain)' WHERE id = 33;
INSERT OR IGNORE INTO question_images (question_id, filename, storage_url) VALUES (37, 'effet_side_droit.png', 'meteo/phenomenes_locaux/37/images/effet_side_droit.png');
UPDATE questions SET question_md = 'Comment s''explique-t-il, comment se concrétise-t-il, quelles conditions sont les plus favorables?', correction_md = 'Le vent n’a pas la même orientation sur l’eau que sur terre. Il est dévié de 20° vers les basses pressions sur mer, 40° sur terre (le vent prend plus de gauche sur terre). Ce phénomène est à l’origine des effets de convergence et de divergence le long des côtes. 

Si la côte est à droite du vent (dans le sens du vent) : Le frottement à la côte provoque une rotation de 20° à gauche et donc une convergence des flux à la côte avec un renforcement du vent sur une bande de 1 à 3 milles.

Inversement si la cote est à gauche du vent il y a divergence du flux à la côte. 

![image_correction](images/effet_side_droit.png)' WHERE id = 37;
INSERT OR IGNORE INTO question_images (question_id, filename, storage_url) VALUES (39, 'venturi.png', 'meteo/phenomenes_locaux/39/images/venturi.png');
UPDATE questions SET question_md = '', correction_md = 'Entre deux obstacles on observe une accélération du flux, appelé effet Venturi. Il s’agit d’un cas particulier de l’effet de canalisation
L''accélération commence avant le détroit et continue quelques milles après. Ex: Gibraltar, Pas de Calais, bouches de Bonifacio, passage entre deux Îles.

![image_correction](images/venturi.png)' WHERE id = 39;
INSERT OR IGNORE INTO question_images (question_id, filename, storage_url) VALUES (40, 'effet_side_gauche.png', 'meteo/phenomenes_locaux/40/images/effet_side_gauche.png');
UPDATE questions SET question_md = '', correction_md = 'Le vent freiné sur terre prend de la droite par rapport au vent de mer, et s’écarte de la côte vers les terres. Il crée donc un vent légèrement orienté vers la terre et affaibli à proximité de la côte.


![image_correction](images/effet_side_gauche.png)' WHERE id = 40;
INSERT OR IGNORE INTO question_images (question_id, filename, storage_url) VALUES (41, 'effet_side_droit.png', 'meteo/phenomenes_locaux/41/images/effet_side_droit.png');
UPDATE questions SET question_md = '', correction_md = 'Le vent freiné sur terre prend de la gauche par rapport au vent de mer, et vient donc créer un vent légèrement orienté vers la mer et renforcé à proximité de la côte.

![image_correction](images/effet_side_droit.png)' WHERE id = 41;
INSERT OR IGNORE INTO question_images (question_id, filename, storage_url) VALUES (42, 'effet_pointe_1.png', 'meteo/phenomenes_locaux/42/images/effet_pointe_1.png');
INSERT OR IGNORE INTO question_images (question_id, filename, storage_url) VALUES (42, 'effet_pointe_4.png', 'meteo/phenomenes_locaux/42/images/effet_pointe_4.png');
UPDATE questions SET question_md = 'Faites de même lorsqu''il se présente dans l''axe de la pointe depuis la mer.
Indiquez les modifications du vent en force et direction', correction_md = '![image_correction](images/effet_pointe_1.png)

![image_correction](images/effet_pointe_4.png)' WHERE id = 42;
INSERT OR IGNORE INTO question_images (question_id, filename, storage_url) VALUES (70, 'ecoulements_laminaires.png', 'fonctionnement_engin/divers/70/images/ecoulements_laminaires.png');
INSERT OR IGNORE INTO question_images (question_id, filename, storage_url) VALUES (70, 'ecoulements_turbulants.png', 'fonctionnement_engin/divers/70/images/ecoulements_turbulants.png');
UPDATE questions SET question_md = 'Faire un schéma', correction_md = 'Écoulements laminaires:
Lorsque l’angle d’incidence est faible (angle entre le vent et la voile), l’écoulement de l’air autour du profil est dit laminaire, c''est-à-dire que les filets d’air parviennent à suivre le profil (la voile donc) et ne créent pas de tourbillon. Ce type d’écoulement dépend du réglage de la voile, de son profil et de la direction du bateau. Les écoulements sont laminaires à toutes les allures sauf au vent arrière et au grand largue, ou bien sur lorsque la voile est trop choquée.


Écoulements turbulents:
L’écoulement est dit turbulent lorsque les filets d’air n’arrivent pas à suivre le profil sur l’extrados. Ils finissent donc par tourbillonner. Il en résulte une perte de puissance dans la voile. On dit que la voile décroche. Situation à éviter. Les écoulements sont turbulents essentiellement au vent arrière et au grand largue.

![image_correction](images/ecoulements_laminaires.png)
![image_correction](images/ecoulements_turbulants.png)' WHERE id = 70;
INSERT OR IGNORE INTO question_images (question_id, filename, storage_url) VALUES (71, 'ecoulements_laminaires.png', 'fonctionnement_engin/divers/71/images/ecoulements_laminaires.png');
UPDATE questions SET question_md = 'Un schéma est attendu.', correction_md = 'La portance est une force générée par une différence de pression entre les deux côtés de la voile lorsque l’écoulement est laminaire. Comme indiqué sur le schéma de la page précédente, une surpression se crée à l’intrados (c’est à dire à l’intérieur de la voile), et une surpression à l’extrados (à l’extérieur de la voile). Cette différence de pression s’explique par la différence de vitesse d’écoulement de l’air de part et d’autre de la voile. La force résultante est orientée de la surpression vers la dépression. Voir schéma ci-dessus. A noter que plus le vent apparent est fort, plus la portance est importante.

![image_correction](images/ecoulements_laminaires.png)' WHERE id = 71;
INSERT OR IGNORE INTO question_images (question_id, filename, storage_url) VALUES (72, 'profile_voile.png', 'fonctionnement_engin/divers/72/images/profile_voile.png');
UPDATE questions SET question_md = 'Indiquer sur le schéma le vocabulaire décrivant ce profil (au moins 5 élements sont attendus).

## Correction
![image_correction](images/profile_voile.png)

<small>Source : [*Cours théorique planche à voile*, Les Glénans CEB, 2023](https://encadrementbenevole.glenans.asso.fr/wp-content/uploads/2023/07/Cours-theorique-PAV-Version-1.pdf) </small>', correction_md = '' WHERE id = 72;
INSERT OR IGNORE INTO question_images (question_id, filename, storage_url) VALUES (73, 'ecoulements_laminaires.png', 'fonctionnement_engin/divers/73/images/ecoulements_laminaires.png');
UPDATE questions SET question_md = 'Un schéma est attendu', correction_md = 'La traînée est une force, orientée dans le sens des écoulements, qui correspond à une perte d''énergie du fluide (le vent ou l’eau) lors de son écoulement sur le profil (la voile ou la coque). Elle se matérialise principalement par des tourbillons à l’arrière du profil. La traînée hydrodynamique derrière un bateau est facilement observable. A noter que plus la vitesse relative du fluide est grande, plus la traînée est importante.

![image_correction](images/ecoulements_laminaires.png)' WHERE id = 73;
