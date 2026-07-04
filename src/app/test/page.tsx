// Copyright (c) Meta Platforms, Inc. and affiliates.

"use client";

import { useAppShellMobile } from "@astryxdesign/core/AppShell";
import { AspectRatio } from "@astryxdesign/core/AspectRatio";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import {
  ChatComposer,
  ChatMessage,
  ChatMessageBubble,
  ChatMessageList,
  ChatSystemMessage,
} from "@astryxdesign/core/Chat";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { Divider } from "@astryxdesign/core/Divider";
import { Grid, GridSpan } from "@astryxdesign/core/Grid";
import { Item } from "@astryxdesign/core/Item";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Link } from "@astryxdesign/core/Link";
import { MoreMenu } from "@astryxdesign/core/MoreMenu";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { OverflowList } from "@astryxdesign/core/OverflowList";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import { Section } from "@astryxdesign/core/Section";
import { SelectableCard } from "@astryxdesign/core/SelectableCard";
import { Selector } from "@astryxdesign/core/Selector";
import { pixel, proportional, Table } from "@astryxdesign/core/Table";
import { Heading, Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TopNav, TopNavHeading, TopNavItem } from "@astryxdesign/core/TopNav";
import {
  Banknote,
  CreditCard,
  Download,
  Folder,
  LayoutGrid,
  List,
  Lock,
  MapPin,
  Mic,
  Plus,
  Search,
  ShoppingBag,
  Smartphone,
  Tag,
  User,
  Wallet,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { BottomSheetDemo } from "@/components/sora-ui/demo/bottom-sheet-demo";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

const tw = {
  card: "min-w-0 border-transparent bg-body text-primary",
  checkoutStack: "min-w-0 w-full",
  paymentCardContent: "min-w-0 w-full text-center break-words",
  inventoryCard: "overflow-hidden bg-surface text-primary",
  inventoryHeader: "px-6 py-6",
  inventoryFilterRow: "w-full overflow-x-auto px-6 py-4",
  inventoryTableWrap: "px-6 pb-2",
  searchInput: "min-w-0 max-w-60 flex-1",
  activityCard: "h-full min-w-0 bg-surface text-primary",
  chatCard: "flex min-w-0 flex-col overflow-hidden bg-surface text-primary",
  chatHeader: "px-4 py-4",
  activityCardStack: "h-full",
  activityListFade:
    "mask-[linear-gradient(to_bottom,black_calc(100%-48px),transparent)] [-webkit-mask-image:linear-gradient(to_bottom,black_calc(100%-48px),transparent)] -mx-2 min-h-0 flex-1 overflow-hidden",
  content: "mx-auto min-w-0 max-w-[880px]",
  heroText: "max-w-[560px] text-center",
  centerText: "text-center",
  cardStack: "h-full",
  cardDescription: "flex-1",
  quantityInput: "min-w-16 shrink-0",
  cartButton: "flex-1",
  inventoryBannerWrap: "px-6 pb-4",
  thumbnail: "block size-10 shrink-0 rounded-md object-cover",
  thumbnailFallback:
    "flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold text-secondary",
  kpiValue:
    "font-heading text-2xl font-bold tracking-tight text-primary leading-[1.1]",
  chatBody: "min-h-0 flex-1 overflow-hidden",
  chatSuggestions: "px-4 pb-2",
  chatComposer: "px-4 pb-4",
  activityIcon:
    "flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-secondary",
  productImage: "size-full object-cover",
  cardBody: "flex flex-1 flex-col p-4",
} as const;

const PRODUCT_IMAGE_KEYS = ["watch", "headphones", "backpack"];

/** Categorical badge variants usable for showcase product/inventory tags. */
export type ShowcaseBadgeVariant =
  | "blue"
  | "cyan"
  | "green"
  | "orange"
  | "pink"
  | "purple"
  | "red"
  | "teal"
  | "yellow";

export interface ProductSpec {
  badge: string;
  badgeVariant: ShowcaseBadgeVariant;
  description: string;
  name: string;
}

const DEFAULT_PRODUCTS: ProductSpec[] = [
  {
    name: "Minimalist Watch",
    description: "Clean design meets everyday durability.",
    badge: "New",
    badgeVariant: "blue",
  },
  {
    name: "Wireless Headphones",
    description: "Immersive sound, all-day comfort.",
    badge: "Popular",
    badgeVariant: "green",
  },
  {
    name: "Canvas Backpack",
    description: "Water-resistant canvas with a quiet, modern profile.",
    badge: "Limited",
    badgeVariant: "yellow",
  },
];

// Neutral product photos, served from the shared astryx asset CDN so the
// scaffolded template renders real imagery without needing local public assets.
const NEUTRAL_CDN = "https://lookaside.facebook.com/assets/astryx";
const DEFAULT_IMAGES: Record<string, string> = {
  watch: `${NEUTRAL_CDN}/Neutral-Watch.png`,
  headphones: `${NEUTRAL_CDN}/Neutral-Headphones.png`,
  backpack: `${NEUTRAL_CDN}/Neutral-Backpack.png`,
  wallet: `${NEUTRAL_CDN}/Neutral-Wallet.png`,
  tumbler: `${NEUTRAL_CDN}/Neutral-Tumbler.png`,
  throw_: `${NEUTRAL_CDN}/Neutral-Blanket.png`,
};

export interface ThemeShowcaseProps {
  /** Product card images keyed by slot (watch/headphones/backpack/…). */
  images?: Record<string, string>;
  /** Inventory table rows. Defaults to the neutral store inventory. */
  inventory?: InventoryRow[];
  /** The three hero product cards. Defaults to the neutral store products. */
  products?: ProductSpec[];
}

// Route: /test — Matcha theme showcase sandbox.
export default function ThemeShowcase() {
  return <ThemeShowcaseStore />;
}

export function ThemeShowcaseStore({
  images = DEFAULT_IMAGES,
  products = DEFAULT_PRODUCTS,
  inventory = DEFAULT_INVENTORY,
}: ThemeShowcaseProps = {}) {
  const { isMobile } = useAppShellMobile();
  return (
    <div className="min-h-full bg-body">
      <StorePreview images={images} isMobile={isMobile} products={products} />
      <div className="bg-surface p-6">
        <CardShowcase
          images={images}
          inventory={inventory}
          isMobile={isMobile}
        />
      </div>
      <div className="flex justify-center bg-body p-6">
        <BottomSheetDemo />
      </div>
    </div>
  );
}

function CardShowcase({
  images,
  inventory,
  isMobile,
}: {
  images: Record<string, string>;
  inventory: InventoryRow[];
  isMobile: boolean;
}) {
  const columns = isMobile ? 1 : ({ minWidth: 200, repeat: "fit" } as const);

  return (
    <VStack gap={8}>
      <Grid columns={columns} gap={4}>
        <GridSpan columns={1}>
          <CheckoutCard isMobile={isMobile} />
        </GridSpan>
        <GridSpan columns={isMobile ? 1 : 2}>
          <ChatCard />
        </GridSpan>
      </Grid>
      <Grid columns={columns} gap={4}>
        <GridSpan columns={isMobile ? 1 : 3}>
          <InventoryCard images={images} inventory={inventory} />
        </GridSpan>
        <GridSpan columns={1}>
          <LatestActivityCard isMobile={isMobile} />
        </GridSpan>
      </Grid>
    </VStack>
  );
}

function StorePreview({
  images,
  products,
  isMobile,
}: {
  images: Record<string, string>;
  products: ProductSpec[];
  isMobile: boolean;
}) {
  return (
    <div data-theme-preview="true">
      <VStack gap={0}>
        <TopNav
          centerContent={
            isMobile ? undefined : (
              <>
                <TopNavItem href="#" isSelected label="Shop" />
                <TopNavItem href="#" label="New In" />
                <TopNavItem href="#" label="Stories" />
                <TopNavItem href="#" label="Help" />
              </>
            )
          }
          endContent={
            <HStack gap={2} vAlign="center">
              <HStack gap={0.5}>
                <Button
                  href="#"
                  icon={<Search size={20} />}
                  isIconOnly
                  label="Search"
                  tooltip="Search"
                  variant="ghost"
                />
                <Button
                  href="#"
                  icon={<User size={20} />}
                  isIconOnly
                  label="Account"
                  tooltip="Account"
                  variant="ghost"
                />
                <Button
                  href="#"
                  icon={<ShoppingBag size={20} />}
                  isIconOnly
                  label="Cart"
                  tooltip="Cart"
                  variant="ghost"
                />
              </HStack>
              <div className="inline-flex shrink-0 items-center justify-center">
                <ThemeSwitcher />
              </div>
              <Button href="#" label="Sign in" variant="primary" />
            </HStack>
          }
          heading={<TopNavHeading heading="Studio" />}
          label="Theme preview navigation"
        />

        <Section padding={6} variant="transparent">
          <VStack className={tw.content} gap={10}>
            <Center>
              <VStack className={tw.heroText} gap={4} hAlign="center">
                <Text color="accent" type="display-2">
                  Little joys,
                  <br />
                  everywhere you go
                </Text>
                <Text color="secondary" type="body">
                  We believe the smallest details are the ones that matter most.
                  Turn an ordinary day into something worth remembering.
                </Text>
              </VStack>
            </Center>

            <Grid columns={isMobile ? 1 : { minWidth: 200, max: 3 }} gap={4}>
              {products.map((p, i) => (
                <Card height="100%" key={p.name} padding={0}>
                  <VStack className={tw.cardStack} gap={0}>
                    <AspectRatio ratio={1}>
                      <img
                        alt={p.name}
                        className={tw.productImage}
                        src={images[PRODUCT_IMAGE_KEYS[i]]}
                      />
                    </AspectRatio>
                    <div className={tw.cardBody}>
                      <VStack className={tw.cardStack} gap={2} hAlign="center">
                        <HStack>
                          <Badge label={p.badge} variant={p.badgeVariant} />
                        </HStack>
                        <Heading className={tw.centerText} level={2}>
                          {p.name}
                        </Heading>
                        <Text
                          className={`${tw.cardDescription} ${tw.centerText}`}
                          color="secondary"
                          type="supporting"
                        >
                          {p.description}
                        </Text>
                        <HStack gap={2} hAlign="center" vAlign="center">
                          <NumberInput
                            className={tw.quantityInput}
                            isLabelHidden
                            label="Quantity"
                            max={99}
                            min={1}
                            onChange={() => {}}
                            size="sm"
                            value={1}
                          />
                          <Button
                            className={tw.cartButton}
                            href="#"
                            label="Add to cart"
                            size="sm"
                            variant="secondary"
                          />
                        </HStack>
                      </VStack>
                    </div>
                  </VStack>
                </Card>
              ))}
            </Grid>
          </VStack>
        </Section>
      </VStack>
    </div>
  );
}

function CheckoutCard({ isMobile }: { isMobile: boolean }) {
  return (
    <Card className={tw.card} padding={5}>
      <VStack className={tw.checkoutStack} gap={4}>
        <Heading level={2}>Checkout</Heading>

        <VStack className={tw.checkoutStack} gap={3}>
          <TextInput
            label="Email"
            onChange={() => {}}
            placeholder="you@studio.com"
            size="lg"
            value=""
          />

          <RadioList
            description="Delivery time may vary based on location and availability."
            label="Shipping method"
            onChange={() => {}}
            value="economy"
          >
            <RadioListItem
              description="Delivered in 5–7 business days"
              endContent={
                <Text type="body" weight="bold">
                  $12.00
                </Text>
              }
              label="Economy Shipping"
              value="economy"
            />
            <RadioListItem
              description="Delivered in 3–5 business days"
              endContent={
                <Text type="body" weight="bold">
                  $16.00
                </Text>
              }
              label="Standard Shipping"
              value="standard"
            />
            <RadioListItem
              description="Delivered in 1–2 business days"
              endContent={
                <Text type="body" weight="bold">
                  $24.00
                </Text>
              }
              label="Express Shipping"
              value="express"
            />
          </RadioList>

          <VStack className={tw.checkoutStack} gap={2}>
            <Text type="supporting" weight="bold">
              Payment method
            </Text>
            <Grid columns={isMobile ? 1 : { minWidth: 70, max: 3 }} gap={2}>
              <SelectableCard
                isSelected={true}
                label="Pay with card"
                onChange={() => {}}
                padding={3}
              >
                <VStack
                  className={tw.paymentCardContent}
                  gap={1}
                  hAlign="center"
                >
                  <CreditCard size={20} />
                  <Text type="supporting" weight="bold">
                    Card
                  </Text>
                </VStack>
              </SelectableCard>
              <SelectableCard
                isSelected={false}
                label="Pay with Apple Pay"
                onChange={() => {}}
                padding={3}
              >
                <VStack
                  className={tw.paymentCardContent}
                  gap={1}
                  hAlign="center"
                >
                  <Smartphone size={20} />
                  <Text type="supporting" weight="bold">
                    Apple Pay
                  </Text>
                </VStack>
              </SelectableCard>
              <SelectableCard
                isSelected={false}
                label="Pay with Google Pay"
                onChange={() => {}}
                padding={3}
              >
                <VStack
                  className={tw.paymentCardContent}
                  gap={1}
                  hAlign="center"
                >
                  <Wallet size={20} />
                  <Text type="supporting" weight="bold">
                    Google Pay
                  </Text>
                </VStack>
              </SelectableCard>
            </Grid>
          </VStack>

          <TextInput
            label="Card number"
            onChange={() => {}}
            placeholder="1234 1234 1234 1234"
            size="lg"
            startIcon={<CreditCard size={16} />}
            value=""
          />

          <Grid columns={isMobile ? 1 : { minWidth: 90, max: 2 }} gap={2}>
            <TextInput
              label="Expiry"
              onChange={() => {}}
              placeholder="MM / YY"
              size="lg"
              value=""
            />
            <TextInput
              label="CVC"
              onChange={() => {}}
              placeholder="123"
              size="lg"
              value=""
            />
          </Grid>

          <Selector
            label="Country"
            onChange={() => {}}
            options={[
              { value: "us", label: "United States" },
              { value: "ca", label: "Canada" },
              { value: "uk", label: "United Kingdom" },
              { value: "de", label: "Germany" },
              { value: "jp", label: "Japan" },
              { value: "au", label: "Australia" },
            ]}
            size="lg"
            value="us"
          />
        </VStack>

        <CheckboxInput
          description="Pay faster on Studio and everywhere Link is accepted."
          label="Securely save my information for 1-click checkout"
          onChange={() => {}}
          value={true}
        />

        <Button
          icon={<Lock size={16} />}
          label="Pay now"
          size="lg"
          variant="primary"
        />
      </VStack>
    </Card>
  );
}

const SUGGESTED_QUESTIONS = [
  "Reschedule delivery",
  "Update shipping address",
  "Start a return",
];

function ChatCard() {
  return (
    <Card className={tw.chatCard} padding={0}>
      <HStack
        className={tw.chatHeader}
        gap={3}
        hAlign="between"
        vAlign="center"
      >
        <Heading level={2}>Studio AI</Heading>

        <HStack gap={1} vAlign="center">
          <Button
            icon={<Download size={16} />}
            isIconOnly
            label="Export conversation"
            size="sm"
            tooltip="Export conversation"
            variant="ghost"
          />
          <Button
            icon={<X size={16} />}
            isIconOnly
            label="Close chat"
            size="sm"
            tooltip="Close chat"
            variant="ghost"
          />
        </HStack>
      </HStack>

      <Divider variant="subtle" />

      <div className={tw.chatBody}>
        <ChatMessageList>
          <ChatSystemMessage>Today</ChatSystemMessage>

          <ChatMessage sender="user">
            <ChatMessageBubble variant="filled">
              Where’s my order?
            </ChatMessageBubble>
          </ChatMessage>

          <ChatMessage sender="assistant">
            <VStack gap={3}>
              <Text type="body">
                Your order #1043 — the Minimalist Watch and Linen Throw —
                shipped this morning from the Aisle 3 warehouse and is currently
                in transit with UPS. It’s on track to arrive at your address by
                end of day tomorrow.
              </Text>
              <Text type="body">
                Let me know if you’d like to reschedule the delivery, redirect
                it to a pickup point, or start a return once it arrives.
              </Text>
            </VStack>
          </ChatMessage>

          <ChatMessage sender="user">
            <ChatMessageBubble variant="filled">
              Can you show me the full details?
            </ChatMessageBubble>
          </ChatMessage>

          <ChatMessage sender="assistant">
            <VStack gap={3}>
              <Text type="body">Here’s everything I have on order #1043:</Text>
              <Card padding={3}>
                <VStack gap={1}>
                  <Item
                    description="Minimalist Watch · Linen Throw"
                    endContent={
                      <Text type="body" weight="bold">
                        $248
                      </Text>
                    }
                    label="Items"
                  />
                  <Item
                    description="UPS Ground"
                    endContent={
                      <Text type="body" weight="bold">
                        $12
                      </Text>
                    }
                    label="Shipping"
                  />
                  <Item
                    description="Tomorrow by 8pm"
                    endContent={<Badge label="On time" variant="green" />}
                    label="Estimated arrival"
                  />
                  <Item
                    description="UPS 1Z 999 AA1 0123 4567 84"
                    endContent={<Link href="#">Track →</Link>}
                    label="Tracking"
                  />
                </VStack>
              </Card>
            </VStack>
          </ChatMessage>
        </ChatMessageList>
      </div>

      <div className={tw.chatSuggestions}>
        <HStack gap={1} hAlign="center" wrap="wrap">
          {SUGGESTED_QUESTIONS.map((question) => (
            <Button
              key={question}
              label={question}
              size="sm"
              variant="secondary"
            />
          ))}
        </HStack>
      </div>

      <div className={tw.chatComposer}>
        <ChatComposer
          footerActions={
            <Button
              icon={<Plus size={16} />}
              isIconOnly
              label="Attach"
              size="md"
              tooltip="Attach"
              variant="ghost"
            />
          }
          onChange={() => {}}
          onSubmit={() => {}}
          placeholder="Ask Studio AI…"
          sendActions={
            <Button
              icon={<Mic size={16} />}
              isIconOnly
              label="Voice input"
              size="md"
              tooltip="Voice input"
              variant="ghost"
            />
          }
          value=""
        />
      </div>
    </Card>
  );
}

interface ActivityRow {
  amount: number;
  detail: string;
  icon: ReactNode;
  id: string;
  label: string;
  time: string;
}

const ACTIVITY: ActivityRow[] = [
  {
    id: "1",
    icon: <ShoppingBag size={16} />,
    label: "Order #1043",
    detail: "Placed · 1:59 pm",
    time: "1:59 pm",
    amount: 248,
  },
  {
    id: "2",
    icon: <Banknote size={16} />,
    label: "Order #1041",
    detail: "Refunded · 12:40 pm",
    time: "12:40 pm",
    amount: -89,
  },
  {
    id: "3",
    icon: <ShoppingBag size={16} />,
    label: "Order #1040",
    detail: "Placed · 10:30 am",
    time: "10:30 am",
    amount: 156,
  },
  {
    id: "4",
    icon: <ShoppingBag size={16} />,
    label: "Order #1038",
    detail: "Placed · 9:11 am",
    time: "9:11 am",
    amount: 412,
  },
  {
    id: "5",
    icon: <ShoppingBag size={16} />,
    label: "Order #1037",
    detail: "Placed · 8:42 am",
    time: "8:42 am",
    amount: 95,
  },
];

function formatAmount(amount: number): string {
  const sign = amount < 0 ? "−" : "+";
  return sign + "$" + Math.abs(amount).toLocaleString();
}

function LatestActivityCard({ isMobile }: { isMobile: boolean }) {
  return (
    <Card className={tw.activityCard} padding={5}>
      <VStack className={tw.activityCardStack} gap={4}>
        <Heading level={2}>Revenue</Heading>

        <Grid columns={isMobile ? 1 : 2} gap={3}>
          <VStack gap={0}>
            <span className={tw.kpiValue}>18K</span>
            <Text color="secondary" type="supporting">
              Monthly revenue
            </Text>
          </VStack>
          <VStack gap={0}>
            <span className={tw.kpiValue}>+12%</span>
            <Text color="secondary" type="supporting">
              Order growth
            </Text>
          </VStack>
        </Grid>

        <Divider variant="subtle" />

        <HStack hAlign="between" vAlign="center">
          <Heading level={3}>Activity</Heading>
          <Link href="#">See all</Link>
        </HStack>

        <VStack className={tw.activityListFade} gap={1}>
          {ACTIVITY.map((item) => (
            <Item
              description={item.detail}
              endContent={
                <Text
                  color={item.amount < 0 ? "secondary" : "primary"}
                  type="body"
                  weight="bold"
                >
                  {formatAmount(item.amount)}
                </Text>
              }
              href="#"
              key={item.id}
              label={item.label}
              startContent={
                <div aria-hidden="true" className={tw.activityIcon}>
                  {item.icon}
                </div>
              }
            />
          ))}
        </VStack>
      </VStack>
    </Card>
  );
}

type TagSpec = { label: string; variant: ShowcaseBadgeVariant };

export interface InventoryRow extends Record<string, unknown> {
  available: number;
  id: string;
  imageKey?: string;
  location: string;
  meta: string;
  name: string;
  selected: boolean;
  tags: TagSpec[];
  thumbnailFallback: string;
}

const DEFAULT_INVENTORY: InventoryRow[] = [
  {
    id: "a",
    name: "Minimalist Watch",
    meta: "Stainless steel, sapphire crystal",
    available: 42,
    location: "Aisle 3",
    tags: [{ label: "New", variant: "blue" }],
    imageKey: "watch",
    thumbnailFallback: "M",
    selected: false,
  },
  {
    id: "b",
    name: "Wireless Headphones",
    meta: "ANC, 30hr battery",
    available: 128,
    location: "Aisle 1",
    tags: [{ label: "Popular", variant: "green" }],
    imageKey: "headphones",
    thumbnailFallback: "W",
    selected: true,
  },
  {
    id: "c",
    name: "Canvas Backpack",
    meta: "Water-resistant, 25L",
    available: 63,
    location: "Aisle 2",
    tags: [{ label: "Limited", variant: "yellow" }],
    imageKey: "backpack",
    thumbnailFallback: "C",
    selected: false,
  },
  {
    id: "d",
    name: "Leather Wallet",
    meta: "Full-grain, RFID blocking",
    available: 15,
    location: "Aisle 4",
    tags: [{ label: "Leather", variant: "yellow" }],
    imageKey: "wallet",
    thumbnailFallback: "L",
    selected: true,
  },
  {
    id: "e",
    name: "Travel Tumbler",
    meta: "Vacuum insulated, 16oz",
    available: 87,
    location: "Aisle 5",
    tags: [{ label: "Drinkware", variant: "green" }],
    imageKey: "tumbler",
    thumbnailFallback: "T",
    selected: false,
  },
  {
    id: "f",
    name: "Linen Throw",
    meta: "Heavyweight, oat",
    available: 24,
    location: "Aisle 6",
    tags: [{ label: "Home", variant: "orange" }],
    imageKey: "throw_",
    thumbnailFallback: "L",
    selected: true,
  },
];

const LOW_STOCK_THRESHOLD = 25;

function SelectCell({ row }: { row: InventoryRow }) {
  return (
    <CheckboxInput
      isLabelHidden
      label={"Select " + row.name}
      onChange={() => {}}
      value={row.selected}
    />
  );
}

function ItemCell({
  row,
  images,
}: {
  row: InventoryRow;
  images: Record<string, string>;
}) {
  const thumbnailSrc = row.imageKey ? images[row.imageKey] : undefined;
  return (
    <HStack gap={3} vAlign="center">
      {thumbnailSrc ? (
        <img alt="" className={tw.thumbnail} src={thumbnailSrc} />
      ) : (
        <div aria-hidden="true" className={tw.thumbnailFallback}>
          {row.thumbnailFallback}
        </div>
      )}
      <VStack className="min-w-0" gap={0}>
        <Text type="body" weight="bold">
          {row.name}
        </Text>
        <Text color="secondary" type="supporting">
          {row.meta}
        </Text>
      </VStack>
    </HStack>
  );
}

function TagsCell({ row }: { row: InventoryRow }) {
  return (
    <HStack gap={1} hAlign="end" wrap="wrap">
      {row.tags.map((tag) => (
        <Badge key={tag.label} label={tag.label} variant={tag.variant} />
      ))}
    </HStack>
  );
}

function ActionsCell() {
  return (
    <MoreMenu
      items={[
        { label: "Edit" },
        { label: "Duplicate" },
        { label: "Move to…" },
        { type: "divider" },
        { label: "Delete" },
      ]}
      label="Row actions"
      size="sm"
    />
  );
}

function InventoryCard({
  images,
  inventory,
}: {
  images: Record<string, string>;
  inventory: InventoryRow[];
}) {
  const lowStockCount = inventory.filter(
    (row) => row.available < LOW_STOCK_THRESHOLD
  ).length;
  return (
    <Card className={tw.inventoryCard} padding={0}>
      <HStack className={tw.inventoryHeader} hAlign="between" vAlign="center">
        <Heading level={2}>Inventory</Heading>
        <Button
          icon={<Plus size={16} />}
          label="Add item"
          size="sm"
          variant="primary"
        />
      </HStack>

      <Divider variant="subtle" />

      <HStack
        className={tw.inventoryFilterRow}
        gap={3}
        hAlign="between"
        vAlign="center"
      >
        <HStack className="min-w-0 flex-1" gap={2} vAlign="center">
          <TextInput
            className={tw.searchInput}
            isLabelHidden
            label="Search inventory"
            onChange={() => {}}
            placeholder="Type and hit enter…"
            startIcon={<Search size={16} />}
            value=""
          />
          <OverflowList
            gap={2}
            overflowRenderer={() => (
              <Button
                icon={<Tag size={16} />}
                label="Filters"
                size="sm"
                variant="ghost"
              />
            )}
          >
            <Selector
              isLabelHidden
              label="Categories"
              onChange={() => {}}
              options={["Wearables", "Audio", "Bags", "Drinkware", "Home"]}
              placeholder="Categories"
              size="sm"
              startIcon={<Folder size={16} />}
              value={undefined}
            />
            <Selector
              isLabelHidden
              label="Locations"
              onChange={() => {}}
              options={[
                "Aisle 1",
                "Aisle 2",
                "Aisle 3",
                "Aisle 4",
                "Aisle 5",
                "Aisle 6",
              ]}
              placeholder="Locations"
              size="sm"
              startIcon={<MapPin size={16} />}
              value={undefined}
            />
            <Selector
              isLabelHidden
              label="Tags"
              onChange={() => {}}
              options={[
                "New",
                "Popular",
                "Limited",
                "Leather",
                "Drinkware",
                "Home",
              ]}
              placeholder="Tags"
              size="sm"
              startIcon={<Tag size={16} />}
              value={undefined}
            />
          </OverflowList>
        </HStack>
        <HStack gap={1} vAlign="center">
          <Button
            icon={<List size={18} />}
            isIconOnly
            label="List view"
            size="sm"
            tooltip="List view"
            variant="ghost"
          />
          <Button
            icon={<LayoutGrid size={18} />}
            isIconOnly
            label="Grid view"
            size="sm"
            tooltip="Grid view"
            variant="ghost"
          />
        </HStack>
      </HStack>

      {lowStockCount > 0 && (
        <div className={tw.inventoryBannerWrap}>
          <Banner
            status="warning"
            title={lowStockCount + " items are running low"}
          />
        </div>
      )}

      <div className={tw.inventoryTableWrap}>
        <Table<InventoryRow>
          columns={[
            {
              key: "select",
              header: "",
              // Wide enough that the control + the theme's cell padding (up to
              // --spacing-4 = 16px/side on spacious density) fit inside the cell,
              // so the control's hover background doesn't overflow toward the
              // card's clipped (rounded) edge on larger-padding themes.
              width: pixel(64),
              renderCell: (row) => <SelectCell row={row} />,
            },
            {
              key: "item",
              header: "Item",
              // Lower min-width (default 120) so the table fits its container on
              // larger-spacing themes instead of overflowing the actions column.
              width: proportional(3, { minWidth: 80 }),
              renderCell: (row) => <ItemCell images={images} row={row} />,
            },
            {
              key: "available",
              header: "Available",
              width: pixel(100),
              renderCell: (row) => <Text type="body">{row.available}</Text>,
            },
            {
              key: "location",
              header: "Location",
              width: pixel(100),
              renderCell: (row) => <Text type="body">{row.location}</Text>,
            },
            {
              key: "tags",
              header: "Tags",
              width: proportional(2, { minWidth: 80 }),
              align: "end",
              renderCell: (row) => <TagsCell row={row} />,
            },
            {
              key: "actions",
              header: "",
              // Match the select column: fit the sm more-menu button + cell
              // padding so its hover background stays clear of the card's
              // clipped rounded edge across themes.
              width: pixel(64),
              align: "end",
              renderCell: () => <ActionsCell />,
            },
          ]}
          data={inventory}
          density="spacious"
          dividers="rows"
          hasHover
        />
      </div>
    </Card>
  );
}
