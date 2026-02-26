import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check } from "lucide-react";
import { ru } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
    DrawerClose,
    DrawerFooter,
} from "@/components/ui/drawer";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

function useMediaQuery(query) {
    const [matches, setMatches] = React.useState(false);

    React.useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        media.addEventListener("change", listener);
        return () => media.removeEventListener("change", listener);
    }, [matches, query]);

    return matches;
}

export function DateTimePicker({ date, setDate }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const [selectedDateTime, setSelectedDateTime] = React.useState(
        date ? new Date(date) : new Date()
    );

    React.useEffect(() => {
        if (date) {
            setSelectedDateTime(new Date(date));
        }
    }, [date, isOpen]);

    const handleDateSelect = (selectedDate) => {
        if (selectedDate) {
            const newDateTime = new Date(selectedDateTime);
            newDateTime.setFullYear(selectedDate.getFullYear());
            newDateTime.setMonth(selectedDate.getMonth());
            newDateTime.setDate(selectedDate.getDate());
            setSelectedDateTime(newDateTime);
        }
    };

    const handleTimeChange = (type, value) => {
        const newDateTime = new Date(selectedDateTime);
        if (type === "hour") {
            newDateTime.setHours(parseInt(value));
        } else if (type === "minute") {
            newDateTime.setMinutes(parseInt(value));
        }
        setSelectedDateTime(newDateTime);
    };

    const handleApply = () => {
        setDate(selectedDateTime);
        setIsOpen(false);
    };

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    const DateTimeContent = () => (
        <>
            <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border">
                <div className="p-3 flex justify-center">
                    <Calendar
                        mode="single"
                        selected={selectedDateTime}
                        onSelect={handleDateSelect}
                        initialFocus
                        locale={ru}
                        className="p-0"
                        classNames={{
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
                            day_today: "bg-accent text-accent-foreground rounded-md",
                        }}
                    />
                </div>
                <div className="p-3 gap-3 w-full sm:w-auto">
                    <div className="flex items-center justify-between gap-2 text-sm font-medium mb-2 px-1">
                        <span>Время</span>
                    </div>
                    <div className="flex justify-center gap-2 h-[260px] sm:h-[260px]">
                        <ScrollArea className="h-full w-16 border border-border rounded-md">
                            <div className="flex flex-col p-1 gap-1">
                                {hours.map((hour) => (
                                    <Button
                                        key={hour}
                                        variant={
                                            selectedDateTime.getHours() === hour
                                                ? "default"
                                                : "ghost"
                                        }
                                        className="h-8 w-full justify-center shrink-0"
                                        onClick={() => handleTimeChange("hour", hour)}
                                    >
                                        {hour.toString().padStart(2, "0")}
                                    </Button>
                                ))}
                            </div>
                            <ScrollBar />
                        </ScrollArea>
                        <ScrollArea className="h-full w-16 border border-border rounded-md">
                            <div className="flex flex-col p-1 gap-1">
                                {minutes.map((minute) => (
                                    <Button
                                        key={minute}
                                        variant={
                                            selectedDateTime.getMinutes() === minute
                                                ? "default"
                                                : "ghost"
                                        }
                                        className="h-8 w-full justify-center shrink-0"
                                        onClick={() => handleTimeChange("minute", minute)}
                                    >
                                        {minute.toString().padStart(2, "0")}
                                    </Button>
                                ))}
                            </div>
                            <ScrollBar />
                        </ScrollArea>
                    </div>
                </div>
            </div>
            <div className="p-3 border-t border-border bg-secondary/20">
                <Button onClick={handleApply} className="w-full rounded-xl gap-2 font-semibold">
                    Применить
                    <Check className="w-4 h-4" />
                </Button>
            </div>
        </>
    );

    if (isDesktop) {
        return (
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal h-14 rounded-[18px] border-border bg-secondary hover:bg-secondary/80",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? (
                            format(date, "d MMMM yyyy HH:mm", { locale: ru })
                        ) : (
                            <span>Выберите дату и время</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                    <DateTimeContent />
                </PopoverContent>
            </Popover>
        );
    }

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal h-14 rounded-[18px] border-border bg-secondary hover:bg-secondary/80",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                        format(date, "d MMMM yyyy HH:mm", { locale: ru })
                    ) : (
                        <span>Выберите дату и время</span>
                    )}
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <div className="mt-4 border-t px-0">
                    <DateTimeContent />
                </div>
                <DrawerFooter className="pt-2">
                    <DrawerClose asChild>
                        <Button variant="outline" className="w-full rounded-xl">Отмена</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
