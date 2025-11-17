import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import Icon from '@/components/ui/icon';

interface Product {
  id: number;
  name: string;
  price: number;
  volume: string;
  category: string;
  collection: string;
  notes: string[];
  inStock: boolean;
  image: string;
  imageBurning: string;
}

const products: Product[] = [
  { id: 1, name: 'Daryan', price: 2800, volume: '200', category: 'средние', collection: 'Classic', notes: ['кедр', 'мандарин', 'бергамот'], inStock: true, image: 'https://cdn.poehali.dev/projects/383567ed-8013-4975-95e4-ae4c2370d804/files/79ee0abe-6b3b-4c38-ae9c-18b44f5b0d3e.jpg', imageBurning: 'https://cdn.poehali.dev/projects/383567ed-8013-4975-95e4-ae4c2370d804/files/0e1166b0-00f9-4637-a2e9-224d45e4d685.jpg' },
  { id: 2, name: 'Cubilia', price: 2800, volume: '200', category: 'средние', collection: 'Classic', notes: ['жасмин', 'роза', 'грейпфрут'], inStock: true, image: 'https://cdn.poehali.dev/projects/383567ed-8013-4975-95e4-ae4c2370d804/files/5420a367-dc73-416f-bc53-6f72f85915c8.jpg', imageBurning: 'https://cdn.poehali.dev/projects/383567ed-8013-4975-95e4-ae4c2370d804/files/0e1166b0-00f9-4637-a2e9-224d45e4d685.jpg' },
  { id: 3, name: 'Vanda', price: 2800, volume: '200', category: 'средние', collection: 'Floral', notes: ['орхидея', 'ваниль', 'амбра'], inStock: true, image: 'https://cdn.poehali.dev/projects/383567ed-8013-4975-95e4-ae4c2370d804/files/79ee0abe-6b3b-4c38-ae9c-18b44f5b0d3e.jpg', imageBurning: 'https://cdn.poehali.dev/projects/383567ed-8013-4975-95e4-ae4c2370d804/files/0e1166b0-00f9-4637-a2e9-224d45e4d685.jpg' },
  { id: 4, name: 'Cora', price: 2800, volume: '200', category: 'средние', collection: 'Floral', notes: ['грейпфрут', 'розовый куст', 'ежевика'], inStock: true, image: 'https://cdn.poehali.dev/projects/383567ed-8013-4975-95e4-ae4c2370d804/files/5420a367-dc73-416f-bc53-6f72f85915c8.jpg', imageBurning: 'https://cdn.poehali.dev/projects/383567ed-8013-4975-95e4-ae4c2370d804/files/0e1166b0-00f9-4637-a2e9-224d45e4d685.jpg' },
  { id: 5, name: 'Stellar', price: 1800, volume: '120', category: 'малые', collection: 'Mini', notes: ['лимон', 'базилик', 'мята'], inStock: true, image: 'https://cdn.poehali.dev/projects/383567ed-8013-4975-95e4-ae4c2370d804/files/79ee0abe-6b3b-4c38-ae9c-18b44f5b0d3e.jpg', imageBurning: 'https://cdn.poehali.dev/projects/383567ed-8013-4975-95e4-ae4c2370d804/files/0e1166b0-00f9-4637-a2e9-224d45e4d685.jpg' },
  { id: 6, name: 'Aurora', price: 3500, volume: '350', category: 'большие', collection: 'Premium', notes: ['удов', 'сандал', 'пачули'], inStock: false, image: 'https://cdn.poehali.dev/projects/383567ed-8013-4975-95e4-ae4c2370d804/files/5420a367-dc73-416f-bc53-6f72f85915c8.jpg', imageBurning: 'https://cdn.poehali.dev/projects/383567ed-8013-4975-95e4-ae4c2370d804/files/0e1166b0-00f9-4637-a2e9-224d45e4d685.jpg' },
];

export default function Index() {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cart, setCart] = useState<number[]>([]);
  const [activeSection, setActiveSection] = useState('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [showInStock, setShowInStock] = useState(false);

  const toggleFavorite = (id: number) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const addToCart = (id: number) => {
    setCart(prev => [...prev, id]);
  };

  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
    if (selectedCollection !== 'all' && p.collection !== selectedCollection) return false;
    if (showInStock && !p.inStock) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-sm">
        Бесплатная доставка по всей России от 1500 руб • Дарим подарки от 2000 руб
      </div>

      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-light tracking-wider">flame moscow</h1>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setActiveSection('search')}>
                <Icon name="Search" size={20} />
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Icon name="Heart" size={20} />
                    {favorites.length > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {favorites.length}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Избранное</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    {favorites.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">Пока пусто</p>
                    ) : (
                      products.filter(p => favorites.includes(p.id)).map(p => (
                        <div key={p.id} className="flex items-center gap-3 border-b pb-3">
                          <img src={p.image} alt={p.name} className="w-16 h-16 object-cover" />
                          <div className="flex-1">
                            <p className="font-medium">{p.name}</p>
                            <p className="text-sm text-muted-foreground">{p.price} ₽</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </SheetContent>
              </Sheet>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Icon name="ShoppingBag" size={20} />
                    {cart.length > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {cart.length}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Корзина</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    {cart.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">Корзина пуста</p>
                    ) : (
                      <>
                        {products.filter(p => cart.includes(p.id)).map((p, idx) => (
                          <div key={idx} className="flex items-center gap-3 border-b pb-3">
                            <img src={p.image} alt={p.name} className="w-16 h-16 object-cover" />
                            <div className="flex-1">
                              <p className="font-medium">{p.name}</p>
                              <p className="text-sm text-muted-foreground">{p.price} ₽</p>
                            </div>
                          </div>
                        ))}
                        <div className="pt-4 border-t">
                          <div className="flex justify-between mb-4">
                            <span className="font-medium">Итого:</span>
                            <span className="font-medium">
                              {products.filter(p => cart.includes(p.id)).reduce((sum, p) => sum + p.price, 0)} ₽
                            </span>
                          </div>
                          <Button className="w-full">Оформить заказ</Button>
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <nav className="flex justify-center gap-8 text-sm uppercase tracking-wider">
            {['Главная', 'Каталог', 'О нас', 'Производство', 'Доставка', 'Контакты'].map(item => (
              <button
                key={item}
                onClick={() => setActiveSection(item.toLowerCase())}
                className={`hover:text-primary transition-colors ${
                  activeSection === item.toLowerCase() ? 'border-b-2 border-primary pb-1' : ''
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {(activeSection === 'catalog' || activeSection === 'главная') && (
        <main className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-light mb-4">Производство ароматических свечей</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Экологически чистое производство ароматических свечей заключается в использовании натуральных компонентов: воска, эфирных и ароматических масел. 
              В мастерской Flame Moscow мы тщательно комбинируем ароматы, добавляя их в восковую основу.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedCategory('малые')}>
              <h3 className="text-2xl mb-2 font-light">Свечи малые до 160 мл</h3>
            </Card>
            <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedCategory('средние')}>
              <h3 className="text-2xl mb-2 font-light">Свечи среднего размера (200-300 мл)</h3>
            </Card>
            <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedCategory('большие')}>
              <h3 className="text-2xl mb-2 font-light">Свечи большие от 300 мл</h3>
            </Card>
          </div>

          <div className="mb-8 flex items-center gap-4 flex-wrap">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Объем" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все размеры</SelectItem>
                <SelectItem value="малые">Малые (до 160 мл)</SelectItem>
                <SelectItem value="средние">Средние (200-300 мл)</SelectItem>
                <SelectItem value="большие">Большие (от 300 мл)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCollection} onValueChange={setSelectedCollection}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Коллекция" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все коллекции</SelectItem>
                <SelectItem value="Classic">Classic</SelectItem>
                <SelectItem value="Floral">Floral</SelectItem>
                <SelectItem value="Mini">Mini</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <label className="text-sm whitespace-nowrap">Цена: {priceRange[0]} - {priceRange[1]} ₽</label>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                min={0}
                max={5000}
                step={100}
                className="w-48"
              />
            </div>

            <Button
              variant={showInStock ? 'default' : 'outline'}
              onClick={() => setShowInStock(!showInStock)}
              className="gap-2"
            >
              <Icon name="Check" size={16} />
              В наличии
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <Card key={product.id} className="group overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 group-hover:opacity-0 absolute inset-0"
                  />
                  <img
                    src={product.imageBurning}
                    alt={`${product.name} горящая`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 opacity-0 group-hover:opacity-100 absolute inset-0"
                  />
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <Icon
                      name="Heart"
                      size={18}
                      className={favorites.includes(product.id) ? 'fill-primary' : ''}
                    />
                  </button>
                  {!product.inStock && (
                    <Badge className="absolute top-3 left-3 bg-muted text-muted-foreground">
                      Нет в наличии
                    </Badge>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-2xl font-light mb-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{product.notes.join(', ')}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-medium">{product.price} ₽</span>
                    <span className="text-sm text-muted-foreground">{product.volume} мл</span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => addToCart(product.id)}
                    disabled={!product.inStock}
                  >
                    В корзину
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </main>
      )}

      {activeSection === 'о нас' && (
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-5xl font-light mb-6">О нас</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Flame Moscow — премиальная мастерская ароматических свечей. 
              Мы создаем уникальные композиции, используя только натуральные компоненты 
              и авторские сочетания ароматов. Каждая свеча — это искусство, созданное с любовью 
              и вниманием к деталям.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div>
                <Icon name="Leaf" size={32} className="mx-auto mb-3" />
                <h3 className="text-xl mb-2">100% натуральный состав</h3>
                <p className="text-sm text-muted-foreground">Только экологичные компоненты</p>
              </div>
              <div>
                <Icon name="Sparkles" size={32} className="mx-auto mb-3" />
                <h3 className="text-xl mb-2">Ручная работа</h3>
                <p className="text-sm text-muted-foreground">Каждая свеча создается вручную</p>
              </div>
              <div>
                <Icon name="Heart" size={32} className="mx-auto mb-3" />
                <h3 className="text-xl mb-2">С любовью</h3>
                <p className="text-sm text-muted-foreground">Внимание к каждой детали</p>
              </div>
            </div>
          </div>
        </main>
      )}

      {activeSection === 'производство' && (
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-light mb-8 text-center">Производство</h2>
            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-2xl mb-2">Отбор компонентов</h3>
                  <p className="text-muted-foreground">
                    Мы тщательно отбираем натуральный воск, эфирные масла и ароматические композиции 
                    от проверенных поставщиков.
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-2xl mb-2">Создание композиции</h3>
                  <p className="text-muted-foreground">
                    Ароматы комбинируются в определенных пропорциях для создания уникальных композиций.
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-2xl mb-2">Заливка и застывание</h3>
                  <p className="text-muted-foreground">
                    Воск заливается в формы и оставляется для полного застывания в контролируемых условиях.
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="text-2xl mb-2">Контроль качества</h3>
                  <p className="text-muted-foreground">
                    Каждая свеча проходит тщательную проверку перед упаковкой и отправкой.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {activeSection === 'доставка' && (
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-5xl font-light mb-8 text-center">Доставка</h2>
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <Icon name="Truck" size={24} className="mt-1" />
                  <div>
                    <h3 className="text-xl mb-2">Бесплатная доставка</h3>
                    <p className="text-muted-foreground">
                      По всей России при заказе от 1500 рублей. Доставка осуществляется курьерскими службами 
                      СДЭК и Boxberry.
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <Icon name="MapPin" size={24} className="mt-1" />
                  <div>
                    <h3 className="text-xl mb-2">Самовывоз</h3>
                    <p className="text-muted-foreground">
                      Вы можете забрать заказ из нашего флагманского магазина на Кропоткинской. 
                      Предварительно свяжитесь с нами для уточнения времени.
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <Icon name="Gift" size={24} className="mt-1" />
                  <div>
                    <h3 className="text-xl mb-2">Подарки</h3>
                    <p className="text-muted-foreground">
                      При заказе от 2000 рублей мы дарим приятные подарки. Упаковка премиум-качества входит в стоимость.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>
      )}

      {activeSection === 'контакты' && (
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-5xl font-light mb-8">Контакты</h2>
            <div className="space-y-6">
              <div>
                <Icon name="MapPin" size={24} className="mx-auto mb-2" />
                <h3 className="text-xl mb-1">Адрес</h3>
                <p className="text-muted-foreground">Москва, ул. Кропоткинская</p>
              </div>
              <div>
                <Icon name="Phone" size={24} className="mx-auto mb-2" />
                <h3 className="text-xl mb-1">Телефон</h3>
                <p className="text-muted-foreground">+7 (495) 123-45-67</p>
              </div>
              <div>
                <Icon name="Mail" size={24} className="mx-auto mb-2" />
                <h3 className="text-xl mb-1">Email</h3>
                <p className="text-muted-foreground">hello@flamemoscow.ru</p>
              </div>
              <div className="flex justify-center gap-4 pt-6">
                <Button variant="outline" size="icon">
                  <Icon name="Instagram" size={20} />
                </Button>
                <Button variant="outline" size="icon">
                  <Icon name="Facebook" size={20} />
                </Button>
                <Button variant="outline" size="icon">
                  <Icon name="MessageCircle" size={20} />
                </Button>
              </div>
            </div>
          </div>
        </main>
      )}

      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 Flame Moscow. Все права защищены.</p>
            <p className="mt-2">Премиальные ароматические свечи ручной работы</p>
          </div>
        </div>
      </footer>
    </div>
  );
}