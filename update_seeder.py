import re

file_path = 'database/seeders/PropertySeeder.php'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

addresses = {
    'Reading': [
        "'building_name_number' => '12',\n                'street_address' => 'Kings Road',\n                'town_city' => 'Reading',\n                'postcode' => 'RG1 2AA',",
        "'building_name_number' => 'The Old Rectory',\n                'street_address' => 'Castle Hill',\n                'town_city' => 'Reading',\n                'postcode' => 'RG1 7SY',",
        "'building_name_number' => 'Flat 4',\n                'street_address' => 'Friar Street',\n                'town_city' => 'Reading',\n                'postcode' => 'RG1 1DP',"
    ],
    'Wokingham': [
        "'building_name_number' => '8',\n                'street_address' => 'Broad Street',\n                'town_city' => 'Wokingham',\n                'postcode' => 'RG40 1AB',",
        "'building_name_number' => '22',\n                'street_address' => 'Gipsy Lane',\n                'town_city' => 'Wokingham',\n                'postcode' => 'RG40 2BT',",
        "'building_name_number' => '45',\n                'street_address' => 'Evendon Road',\n                'town_city' => 'Wokingham',\n                'postcode' => 'RG41 4DZ',"
    ],
    'Bracknell': [
        "'building_name_number' => '2',\n                'street_address' => 'High Street',\n                'town_city' => 'Bracknell',\n                'postcode' => 'RG12 1LL',",
        "'building_name_number' => '14',\n                'street_address' => 'Crowthorne Road',\n                'town_city' => 'Bracknell',\n                'postcode' => 'RG12 7DG',",
        "'building_name_number' => 'Unit 7',\n                'street_address' => 'Western Road',\n                'town_city' => 'Bracknell',\n                'postcode' => 'RG12 1RW',"
    ],
    'Caversham': [
        "'building_name_number' => '19',\n                'street_address' => 'Church Road',\n                'town_city' => 'Caversham',\n                'postcode' => 'RG4 7AA',",
        "'building_name_number' => '33',\n                'street_address' => 'Gosbrook Road',\n                'town_city' => 'Caversham',\n                'postcode' => 'RG4 8BS',",
        "'building_name_number' => '1',\n                'street_address' => 'Prospect Street',\n                'town_city' => 'Caversham',\n                'postcode' => 'RG4 8JB',"
    ],
    'Slough': [
        "'building_name_number' => '101',\n                'street_address' => 'High Street',\n                'town_city' => 'Slough',\n                'postcode' => 'SL1 1DH',",
        "'building_name_number' => '42',\n                'street_address' => 'Farnham Road',\n                'town_city' => 'Slough',\n                'postcode' => 'SL1 4TA',",
        "'building_name_number' => '5',\n                'street_address' => 'Bath Road',\n                'town_city' => 'Slough',\n                'postcode' => 'SL1 3UD',"
    ],
    'Maidenhead': [
        "'building_name_number' => '18',\n                'street_address' => 'Queen Street',\n                'town_city' => 'Maidenhead',\n                'postcode' => 'SL6 1HZ',",
        "'building_name_number' => '9',\n                'street_address' => 'Marlow Road',\n                'town_city' => 'Maidenhead',\n                'postcode' => 'SL6 7AA',",
        "'building_name_number' => 'Suite 3',\n                'street_address' => 'High Street',\n                'town_city' => 'Maidenhead',\n                'postcode' => 'SL6 1QA',"
    ],
    'Windsor': [
        "'building_name_number' => '24',\n                'street_address' => 'Peascod Street',\n                'town_city' => 'Windsor',\n                'postcode' => 'SL4 1DU',",
        "'building_name_number' => '11',\n                'street_address' => 'St Leonards Road',\n                'town_city' => 'Windsor',\n                'postcode' => 'SL4 3BP',",
        "'building_name_number' => '6',\n                'street_address' => 'Vansittart Road',\n                'town_city' => 'Windsor',\n                'postcode' => 'SL4 5DF',"
    ],
    'Ascot': [
        "'building_name_number' => '15',\n                'street_address' => 'High Street',\n                'town_city' => 'Ascot',\n                'postcode' => 'SL5 7HG',",
        "'building_name_number' => '8',\n                'street_address' => 'London Road',\n                'town_city' => 'Ascot',\n                'postcode' => 'SL5 7EN',",
        "'building_name_number' => 'Apt 2',\n                'street_address' => 'Station Hill',\n                'town_city' => 'Ascot',\n                'postcode' => 'SL5 9EG',"
    ]
}

def replace_location(match):
    loc_key = match.group(1)
    if loc_key in addresses and len(addresses[loc_key]) > 0:
        addr = addresses[loc_key].pop(0)
        return f"'location' => '{loc_key}',\n                {addr}"
    return match.group(0)

content = re.sub(r"'location'\s*=>\s*'([^']+)',", replace_location, content)

content = content.replace(
    "'property_category_id' => $category->id,",
    "'property_category_id' => $category->id,\n            'building_name_number' => $data['building_name_number'] ?? null,\n            'street_address' => $data['street_address'] ?? null,\n            'town_city' => $data['town_city'] ?? $data['location'],\n            'postcode' => $data['postcode'] ?? null,"
)
content = content.replace(
    "'location' => $data['location'],",
    "'location' => $data['town_city'] ?? $data['location'],"
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated seeder successfully!")
