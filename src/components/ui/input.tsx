import * as React from "react";

import { cn } from "@/lib/utils";
import { mascararCampo, type MascaraCampo } from "@/lib/mascaras";

type InputProps = React.ComponentProps<"input"> & { mask?: MascaraCampo };

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, mask, onChange, onKeyDown, maxLength, inputMode, min, ...props }, ref) => {
    const limite = maxLength ?? (mask === "cpfCnpj" ? 18 : mask === "rgCpf" ? 18 : mask === "telefone" ? 15 : mask === "cep" ? 9 : type === "email" ? 254 : type === "text" || !type ? 500 : undefined);
    return (
      <input
        type={type}
        maxLength={limite}
        inputMode={inputMode ?? (mask === "telefone" ? "tel" : mask ? "decimal" : undefined)}
        min={min ?? (type === "number" ? 0 : undefined)}
        onKeyDown={(event) => {
          if (type === "number" && ["e", "E", "+", "-"].includes(event.key)) event.preventDefault();
          onKeyDown?.(event);
        }}
        onChange={(event) => {
          if (mask) event.currentTarget.value = mascararCampo(event.currentTarget.value, mask);
          onChange?.(event);
        }}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
