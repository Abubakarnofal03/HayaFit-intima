import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface Size {
    id?: string;
    name: string;
    price: string;
    quantity: string;
    sort_order: number;
    apply_sale: boolean;
}

interface SizeManagerProps {
    sizes: Size[];
    onChange: (sizes: Size[]) => void;
}

export function SizeManager({ sizes, onChange }: SizeManagerProps) {
    const addSize = () => {
        const newSize: Size = {
            name: "",
            price: "",
            quantity: "0",
            sort_order: sizes.length,
            apply_sale: true,
        };
        onChange([...sizes, newSize]);
    };

    const removeSize = (index: number) => {
        const updated = sizes.filter((_, i) => i !== index);
        onChange(updated);
    };

    const updateSize = (index: number, field: keyof Size, value: string | boolean) => {
        const updated = sizes.map((s, i) =>
            i === index ? { ...s, [field]: value } : s
        );
        onChange(updated);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label>Product Sizes (Optional)</Label>
                <Button type="button" size="sm" variant="outline" onClick={addSize}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Size
                </Button>
            </div>

            {sizes.length > 0 && (
                <div className="space-y-2">
                    {sizes.map((size, index) => (
                        <Card key={index}>
                            <CardContent className="p-3">
                                <div className="flex items-start gap-2">
                                    <div className="mt-2">
                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <Label className="text-xs">Name</Label>
                                                <Input
                                                    placeholder="e.g., Small, Medium"
                                                    value={size.name}
                                                    onChange={(e) => updateSize(index, "name", e.target.value)}
                                                    className="h-8"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Price</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={size.price}
                                                    onChange={(e) => updateSize(index, "price", e.target.value)}
                                                    className="h-8"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Quantity</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    value={size.quantity}
                                                    onChange={(e) => updateSize(index, "quantity", e.target.value)}
                                                    className="h-8"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={`size-apply-sale-${index}`}
                                                checked={size.apply_sale}
                                                onChange={(e) => updateSize(index, "apply_sale", e.target.checked)}
                                                className="rounded border-input"
                                            />
                                            <Label htmlFor={`size-apply-sale-${index}`} className="text-xs cursor-pointer">
                                                Apply sale discount to this size
                                            </Label>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 mt-4"
                                        onClick={() => removeSize(index)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
