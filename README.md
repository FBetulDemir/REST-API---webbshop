# REST-API---webbshop

Beskrivning : Detta RESTful API hanterar produkter, användare och kundvagnsdata för en webbshop.
API:et är byggt för att användas av en frontendapplikation .

Tekniker: Node.js, TypeScript, Express, DynamoDB, Zod (för validering)

Installation & körning
git clone https://github.com/FBetulDemir/REST-API---webbshop.git
cd REST-API---webbshop
npm install
npm run dev

Miljövariabler (.env):
PORT=3000
AWS_ACCESS_KEY_ID=xxxx
AWS_SECRET_ACCESS_KEY=xxxx
AWS_REGION=eu-north-1
DYNAMO_TABLE_NAME=webbshop

/api/products

GET	: Hämta alla produkter	/api/products
GET	:Hämta en produkt	/api/products/:id
POST :Lägg till en ny produkt	/api/products
PUT	:Uppdatera produkt	/api/products/:id
DELETE	:Ta bort produkt	/api/products/:id

/api/cart

GET	:Hämta hela kundvagnen	/api/cart
POST :Lägg till vara i kundvagnen	/api/cart
PUT	:Ändra antal produkter	/api/cart/:id
DELETE :Ta bort vara från kundvagnen	/api/cart/:id



/api/users

GET	:Hämta alla användare	/api/users
POST :Skapa ny användare	/api/users
PUT	:Uppdatera användare	/api/users/:id
DELETE	:Ta bort användare	/api/users/:id



Teammedlemmar:Paria, Albin, Betul

env till david
PORT=3000
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=AKIAVETOI53AIJ7RJIKY
AWS_SECRET_ACCESS_KEY=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
TABLE_NAME=webshop
