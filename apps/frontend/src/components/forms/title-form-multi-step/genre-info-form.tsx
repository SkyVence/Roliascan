"use client"

import type { UseFormReturn } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { MultiSelectCombobox } from "./multi-select-combobox"

interface GenreInfoFormProps {
  form: UseFormReturn<any>
  genres: {
    id: string
    name: string
  }[]
}

export default function GenreInfoForm({ form, genres }: GenreInfoFormProps) {
  return (
    <div className="space-y-6">
      <Form {...form}>
        <FormField
          control={form.control}
          name="genreInfo.genreOption"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Genre Information</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="existing" />
                    </FormControl>
                    <FormLabel className="font-normal">Select existing genres</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="new" />
                    </FormControl>
                    <FormLabel className="font-normal">Create a new genre</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("genreInfo.genreOption") === "existing" ? (
          <FormField
            control={form.control}
            name="genreInfo.existingGenres"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Select Genres</FormLabel>
                <FormControl>
                  <MultiSelectCombobox
                    options={genres.map((genre) => ({
                      label: genre.name,
                      value: genre.id,
                    }))}
                    selected={field.value || []}
                    onChange={field.onChange}
                    placeholder="Search and select genres..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <div className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="genreInfo.newGenre.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Genre Name*</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter genre name"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e.target.value)
                        // Ensure the newGenre object exists
                        const currentGenre = form.getValues("newGenre") || {}
                        form.setValue("newGenre", {
                          ...currentGenre,
                          name: e.target.value,
                        })
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="genreInfo.newGenre.description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter genre description" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </Form>
    </div>
  )
}
