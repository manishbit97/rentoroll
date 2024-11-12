import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { ThemedText } from "../ThemedText";
import { RadioButton } from "react-native-paper";

export default function ManageFlatFields() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  return (
    // backgroundColor: "#e8ecf4"
    <View style={{ flex: 1 }} id="formwrapper">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Occupancy Details</Text>

          <Text style={styles.subtitle}>
            Fill in the fields below to assign a tenant to your flat
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.card} id="Card1">
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Flat Id</Text>

              <TextInput
                clearButtonMode="while-editing"
                onChangeText={(name) => setForm({ ...form, name })}
                placeholder="Enter flat no (eg 101)"
                placeholderTextColor="#6b7280"
                style={styles.inputControl}
                value={form.name}
              />
            </View>
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Monthly Flat Rent (in Rs.)</Text>

              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
                keyboardType="default"
                returnKeyType="next"
                onChangeText={(email) => setForm({ ...form, email })}
                placeholder="6000"
                placeholderTextColor="#6b7280"
                style={styles.inputControl}
                value={form.email}
              />
            </View>
          </View>

          {/* Card 1 */}
          <View style={styles.card} id="Card1">
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Start Date for occupancy</Text>

              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
                keyboardType="default"
                returnKeyType="next"
                onChangeText={(email) => setForm({ ...form, email })}
                placeholder="21-01-2024"
                placeholderTextColor="#6b7280"
                style={styles.inputControl}
                value={form.email}
              />
            </View>
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Rent Collection Date</Text>

              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
                keyboardType="default"
                returnKeyType="next"
                onChangeText={(email) => setForm({ ...form, email })}
                placeholder="01-02-2024"
                placeholderTextColor="#6b7280"
                style={styles.inputControl}
                value={form.email}
              />
            </View>
          </View>
          {/* Card 2 */}
          <View style={styles.card} id="Card2">
            <ThemedText
              type="subtitle"
              lightColor="black"
              style={styles.cardHeader}
            >
              Electricity Bill
            </ThemedText>
            <View style={styles.radiogrp}>
              <RadioButton.Group
                onValueChange={(newValue) => {}}
                value={"first"}
              >
                <View>
                  <RadioButton.Item value="first" label="Rate per unit" />
                </View>
                <View>
                  <RadioButton.Item value="second" label="Fixed" />
                </View>
              </RadioButton.Group>
            </View>
            <View style={styles.input}>
              <Text style={styles.inputLabel}>
                Initial Meter Reading(in KWh)
              </Text>

              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
                keyboardType="default"
                returnKeyType="next"
                onChangeText={(email) => setForm({ ...form, email })}
                placeholder="4040"
                placeholderTextColor="#6b7280"
                style={styles.inputControl}
                value={form.email}
              />
            </View>
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Rate per unit (in Rs)</Text>

              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
                keyboardType="default"
                returnKeyType="next"
                onChangeText={(email) => setForm({ ...form, email })}
                placeholder="7.25"
                placeholderTextColor="#6b7280"
                style={styles.inputControl}
                value={form.email}
              />
            </View>
          </View>
          {/* Card 3  */}
          <View style={styles.card} id="Card3">
            <ThemedText
              type="subtitle"
              lightColor="black"
              style={styles.cardHeader}
            >
              Water Bill
            </ThemedText>
            <View style={styles.radiogrp}>
              <RadioButton.Group
                onValueChange={(newValue) => {}}
                value={"second"}
              >
                <View>
                  <RadioButton.Item value="first" label="Rate per unit" />
                </View>
                <View>
                  <RadioButton.Item value="second" label="Fixed" />
                </View>
              </RadioButton.Group>
            </View>
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Enter Fixed amount (in Rs.)</Text>

              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
                keyboardType="default"
                returnKeyType="next"
                onChangeText={(email) => setForm({ ...form, email })}
                placeholder="200"
                placeholderTextColor="#6b7280"
                style={styles.inputControl}
                value={form.email}
              />
            </View>
          </View>
          <View style={styles.card} id="Card4">
            <ThemedText
              type="subtitle"
              lightColor="black"
              style={styles.cardHeader}
            >
              Advance Payment
            </ThemedText>
            <View style={styles.input}>
              <Text style={styles.inputLabel}>
                Enter Advance Amount (in Rs.)
              </Text>

              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
                keyboardType="default"
                returnKeyType="next"
                onChangeText={(email) => setForm({ ...form, email })}
                placeholder="6000"
                placeholderTextColor="#6b7280"
                style={styles.inputControl}
                value={form.email}
              />
            </View>
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Notes Section</Text>

              <TextInput
                autoCapitalize="none"
                multiline={true}
                numberOfLines={8}
                autoCorrect={false}
                clearButtonMode="while-editing"
                keyboardType="default"
                returnKeyType="next"
                onChangeText={(email) => setForm({ ...form, email })}
                placeholder="For Eg. No Pets Allowed. No Car parking available"
                placeholderTextColor="#6b7280"
                style={{ ...styles.inputControl, height: 150 }}
                value={form.email}
              />
            </View>
          </View>
          <View style={styles.formAction}>
            <TouchableOpacity
              onPress={() => {
                // handle onPress
              }}
            >
              <View style={styles.btn}>
                <Text style={styles.btnText}>Get Started</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  title: {
    fontSize: 31,
    fontWeight: "700",
    color: "#1D2A32",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#929292",
  },
  radiogrp: {
    marginBottom: 16,
  },

  /** Header */
  header: {
    alignItems: "flex-start",
    justifyContent: "flex-start",
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  cardHeader: {
    fontSize: 22,
    fontWeight: "600",
    color: "#222",
    marginBottom: 16,
  },
  headerBack: {
    padding: 8,
    paddingTop: 0,
    position: "relative",
    marginLeft: -16,
    marginBottom: 6,
  },
  /** Form */
  form: {
    marginBottom: 24,
    paddingHorizontal: 16,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  formAction: {
    marginTop: 4,
    marginBottom: 16,
  },
  formFooter: {
    paddingVertical: 24,
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    textAlign: "center",
    letterSpacing: 0.15,
  },
  /** Input */
  input: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 17,
    fontWeight: "400",
    color: "#222",
    marginBottom: 8,
  },
  inputControl: {
    height: 50,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 15,
    fontWeight: "500",
    color: "#222",
    borderWidth: 1,
    borderColor: "#C9D3DB",
    borderStyle: "solid",
    opacity: 0.5,
  },
  /** Button */
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    backgroundColor: "#075eec",
    borderColor: "#075eec",
  },
  btnText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "600",
    color: "#fff",
  },

  card: {
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#fff",
    shadowColor: "#90a0ca",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff1f5",
  },
});
